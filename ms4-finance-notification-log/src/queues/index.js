import { Queue } from 'bullmq';
import { config } from '../config.js';

// Queue for consuming notification jobs from other services
export const notificationQueue = new Queue('notifications', {
  connection: {
    url: config.redisUrl,
  },
});

// Queue for consuming audit log jobs from other services
export const auditQueue = new Queue('audit', {
  connection: {
    url: config.redisUrl,
  },
});
