import { Queue } from 'bullmq';
import { config } from '../config.js';

export const notificationQueue = new Queue('notifications', {
  connection: {
    url: config.redisUrl,
  },
});
