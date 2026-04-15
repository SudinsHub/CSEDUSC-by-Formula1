import { Queue } from 'bullmq';
import { config } from '../config.js';

export const schedulerQueue = new Queue('election-scheduler', {
  connection: {
    url: config.redisUrl,
  },
});
