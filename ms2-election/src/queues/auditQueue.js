import { Queue } from 'bullmq';
import { config } from '../config.js';

export const auditQueue = new Queue('audit', {
  connection: {
    url: config.redisUrl,
  },
});
