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
};
