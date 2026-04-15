import { electionRepository } from '../repositories/electionRepository.js';
import { scheduleElection } from './schedulerService.js';

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
    return await electionRepository.findAll();
  },

  async getById(electionId) {
    return await electionRepository.findById(electionId);
  },

  async update(electionId, data) {
    return await electionRepository.update(electionId, data);
  },
};
