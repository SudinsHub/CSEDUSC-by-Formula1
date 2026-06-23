import { candidateRepository } from '../repositories/candidateRepository.js';

export const candidateService = {
  async addCandidate(electionId, userId, bio, post) {
    const candidateData = {
      electionId,
      userId,
      bio,
      post,
    };
    return await candidateRepository.insert(candidateData);
  },

  async listCandidates(electionId) {
    return await candidateRepository.findByElection(electionId);
  },

  async removeCandidate(candidateId) {
    return await candidateRepository.delete(candidateId);
  },

  async updateCandidate(candidateId, data) {
    return await candidateRepository.update(candidateId, data);
  },
};
