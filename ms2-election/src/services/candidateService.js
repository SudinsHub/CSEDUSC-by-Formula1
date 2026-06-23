import { candidateRepository } from '../repositories/candidateRepository.js';
import { electionRepository } from '../repositories/electionRepository.js';

export const candidateService = {
  async addCandidate(electionId, userId, bio, post) {
    const election = await electionRepository.findById(electionId);
    const phase = election ? election.phase : 1;

    const candidateData = {
      electionId,
      userId,
      bio,
      post,
      phase,
      status: 'approved',
    };
    return await candidateRepository.insert(candidateData);
  },

  async listCandidates(electionId, phase = null) {
    if (phase === null) {
      const election = await electionRepository.findById(electionId);
      phase = election ? election.phase : 1;
    }
    return await candidateRepository.findByElection(electionId, phase);
  },

  async removeCandidate(candidateId) {
    return await candidateRepository.delete(candidateId);
  },

  async updateCandidate(candidateId, data) {
    return await candidateRepository.update(candidateId, data);
  },

  async applyNominationOrDesignation(electionId, userId, bio, designation) {
    const election = await electionRepository.findById(electionId);
    if (!election) throw new Error('Election not found');

    if (election.phase === 1) {
      // Phase 1: Self-nomination
      const existing = await candidateRepository.findCandidateByUserAndPhase(electionId, userId, 1);
      if (existing) {
        throw new Error('You have already nominated yourself for this election');
      }

      // Check if election is active or closed (applications only allowed in scheduled)
      if (election.status !== 'scheduled') {
        throw new Error('Nominations are only open when election is scheduled');
      }

      return await candidateRepository.insert({
        electionId,
        userId,
        bio,
        post: 'Representative',
        phase: 1,
        status: 'pending',
      });
    } else {
      // Phase 2: Apply for designation
      const existing = await candidateRepository.findCandidateByUserAndPhase(electionId, userId, 2);
      if (!existing) {
        throw new Error('You are not registered as a candidate in Phase 2');
      }

      // Validate designation
      const designations = election.designations || [];
      const isValid = designations.some(d => d.name === designation);
      if (!isValid) {
        throw new Error(`Invalid designation: '${designation}'`);
      }

      return await candidateRepository.update(existing.candidate_id, {
        bio,
        post: designation,
      });
    }
  },

  async updateCandidateStatus(candidateId, status) {
    return await candidateRepository.update(candidateId, { status });
  },
};
