import { Queue } from 'bullmq';
import { config } from '../config.js';

// Parse Redis URL
const redisUrl = new URL(config.redisUrl);

export const auditQueue = new Queue('audit', {
  connection: {
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port) || 6379,
  },
});
