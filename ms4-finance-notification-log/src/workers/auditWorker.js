import { Worker } from 'bullmq';
import { config } from '../config.js';
import { logRepository } from '../repositories/logRepository.js';

export function startAuditWorker() {
  const worker = new Worker(
    'audit',
    async (job) => {
      console.log(`Processing audit job: ${job.name}`, job.data);

      try {
        await writeLog(job.data);
      } catch (error) {
        console.error(`Error processing audit job ${job.name}:`, error);
        throw error;
      }
    },
    {
      connection: {
        url: config.redisUrl,
      },
      concurrency: 10,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 500,
      },
    }
  );

  worker.on('completed', (job) => {
    console.log(`Audit job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Audit job ${job.id} failed:`, err);
  });

  console.log('AuditWorker started');
  return worker;
}

async function writeLog(payload) {
  const { actor, action, target, targetId, details } = payload;
  
  await logRepository.insert({
    actorUserId: actor,
    actionType: action,
    targetEntity: target,
    targetEntityId: targetId,
    details: details || {},
  });
  
  console.log(`Audit log written: ${action} by user ${actor} on ${target} ${targetId}`);
}
