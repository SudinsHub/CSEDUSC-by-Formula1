import { logRepository } from '../repositories/logRepository.js';

export const logService = {
  async list(filters) {
    return await logRepository.findAll(filters);
  },
};
