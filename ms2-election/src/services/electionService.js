import { electionRepository } from '../repositories/electionRepository.js';
import { scheduleElection } from './schedulerService.js';
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
        election.hasVoted = await voteService.hasVoted(electionId, userId);
      } else {
        election.hasVoted = false;
      }
    }
    return election;
  },

  async update(electionId, data) {
    return await electionRepository.update(electionId, data);
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
};
