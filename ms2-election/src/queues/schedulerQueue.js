import { Queue } from 'bullmq';
import { config } from '../config.js';

// Parse Redis URL
const redisUrl = new URL(config.redisUrl);
console.log('Scheduler Queue Redis connection:', {
  hostname: redisUrl.hostname,
  port: parseInt(redisUrl.port) || 6379,
  originalUrl: config.redisUrl
});

export const schedulerQueue = new Queue('election-scheduler', {
  connection: {
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port) || 6379,
  },
});
