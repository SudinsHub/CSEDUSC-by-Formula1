import { electionRepository } from '../repositories/electionRepository.js';
import { candidateRepository } from '../repositories/candidateRepository.js';
import { voteRepository } from '../repositories/voteRepository.js';
import { scheduleElection, cancelSchedule } from './schedulerService.js';
import { voteService } from './voteService.js';

export const electionService = {
  async create(data, adminId) {
    // Set initial status to 'scheduled'
    const electionData = {
      ...data,
      status: 'scheduled',
      createdBy: adminId,
    };

    const election = await electionRepository.insert(electionData);

    // Schedule automatic open/close
    await scheduleElection(election);

    return election;
  },

  async list() {
    const elections = await electionRepository.findAll();
    const now = new Date();
    for (const election of elections) {
      await this.checkAndTriggerStatusUpdate(election, now);
    }
    return elections;
  },

  async getById(electionId, userId) {
    const election = await electionRepository.findById(electionId);
    if (election) {
      await this.checkAndTriggerStatusUpdate(election, new Date());
      if (userId) {
        election.hasVoted = await voteService.hasVoted(electionId, userId, election.phase);
      } else {
        election.hasVoted = false;
      }
    }
    return election;
  },

  async update(electionId, data) {
    return await electionRepository.update(electionId, data);
  },

  async delete(electionId) {
    return await electionRepository.delete(electionId);
  },

  async checkAndTriggerStatusUpdate(election, now) {
    const startTime = new Date(election.start_time);
    const endTime = new Date(election.end_time);

    if (election.status === 'scheduled' && now >= startTime && now < endTime) {
      election.status = 'active';
      await electionRepository.updateStatus(election.election_id, 'active');
    } else if (election.status !== 'closed' && now >= endTime) {
      election.status = 'closed';
      await electionRepository.updateStatus(election.election_id, 'closed');
    }
  },

  async getPhase1Winners(electionId) {
    const election = await electionRepository.findById(electionId);
    if (!election) throw new Error('Election not found');

    const allCandidates = await voteRepository.countVotesByCandidate(electionId, 1);
    const winners = [];
    const start = election.batch_start_year;
    const end = election.batch_end_year;
    const limit = election.representatives_per_batch || 5;

    for (let year = start; year <= end; year++) {
      const batchCandidates = allCandidates.filter(c => c.batch_year === year);
      if (batchCandidates.length === 0) continue;

      // batchCandidates is already sorted by vote_count DESC.
      // We take the top 'limit' candidates, including any ties for the last spot.
      const batchWinners = [];
      for (let i = 0; i < batchCandidates.length; i++) {
        const cand = batchCandidates[i];
        const votes = parseInt(cand.vote_count, 10);
        
        if (i < limit) {
          batchWinners.push(cand);
        } else {
          const lastElectedVotes = parseInt(batchWinners[batchWinners.length - 1].vote_count, 10);
          if (votes === lastElectedVotes) {
            batchWinners.push(cand);
          } else {
            break;
          }
        }
      }
      winners.push(...batchWinners);
    }
    return winners;
  },

  async transitionToPhase2(electionId, data) {
    const election = await electionRepository.findById(electionId);
    if (!election) throw new Error('Election not found');
    if (election.phase !== 1 || election.status !== 'closed') {
      throw new Error('Election must be closed and in Phase 1 to transition');
    }

    // Determine Phase 1 winners and mark them
    const winners = await this.getPhase1Winners(electionId);
    for (const winner of winners) {
      await candidateRepository.update(winner.candidate_id, { is_elected: true });
    }

    // Transition election row to Phase 2
    const updatedElection = await electionRepository.update(electionId, {
      phase: 2,
      status: 'scheduled',
      startTime: data.startTime,
      endTime: data.endTime,
      designations: data.designations,
    });

    // Write Phase 2 candidate records
    for (const userId of data.candidates) {
      await candidateRepository.insert({
        electionId,
        userId,
        bio: '',
        post: '',
        phase: 2,
        status: 'approved',
      });
    }

    // Cancel old timer jobs and schedule new ones
    await cancelSchedule(electionId);
    await scheduleElection(updatedElection);

    return updatedElection;
  },
};
