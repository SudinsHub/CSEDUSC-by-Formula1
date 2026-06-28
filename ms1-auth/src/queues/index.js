import { Queue } from 'bullmq';
import { config } from '../config.js';

// Parse Redis URL
const redisUrl = new URL(config.redisUrl);
const redisConnection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port) || 6379,
};

// Notification queue - for sending emails
export const notificationQueue = new Queue('notifications', {
  connection: redisConnection,
});

// Helper function to emit notification events
export const emitNotification = async (type, payload) => {
  try {
    await notificationQueue.add(type, payload);
  } catch (err) {
    console.error(`Failed to enqueue notification [${type}]:`, err);
  }
};
