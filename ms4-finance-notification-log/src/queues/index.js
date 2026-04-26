import { Queue } from 'bullmq';
import { config } from '../config.js';

// Parse Redis URL
const redisUrl = new URL(config.redisUrl);

// Queue for consuming notification jobs from other services
export const notificationQueue = new Queue('notifications', {
  connection: {
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port) || 6379,
  },
});

// Queue for consuming audit log jobs from other services
export const auditQueue = new Queue('audit', {
  connection: {
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port) || 6379,
  },
});
