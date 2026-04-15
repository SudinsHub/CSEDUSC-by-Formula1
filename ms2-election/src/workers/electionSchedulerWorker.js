import { Worker } from 'bullmq';
import { config } from '../config.js';
import { electionRepository } from '../repositories/electionRepository.js';
import { notificationQueue } from '../queues/notificationQueue.js';
import { auditQueue } from '../queues/auditQueue.js';

export function startSchedulerWorker() {
  const worker = new Worker(
    'election-scheduler',
    async (job) => {
      const { electionId, action } = job.data;

      if (action === 'open') {
        await handleOpen(electionId);
      } else if (action === 'close') {
        await handleClose(electionId);
      }
    },
    {
      connection: {
        url: config.redisUrl,
      },
    }
  );

  worker.on('completed', (job) => {
    console.log(`Scheduler job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Scheduler job ${job.id} failed:`, err);
  });

  console.log('Election scheduler worker started');
}

async function handleOpen(electionId) {
  // Update election status to 'active'
  await electionRepository.updateStatus(electionId, 'active');

  const election = await electionRepository.findById(electionId);

  // Emit notification event
  await notificationQueue.add('election.announced', {
    electionId: election.election_id,
    title: election.title,
    startTime: election.start_time,
    eligibleRoles: ['student', 'ec_member', 'admin'],
  });

  console.log(`Election ${electionId} opened`);
}

async function handleClose(electionId) {
  // Update election status to 'closed'
  await electionRepository.updateStatus(electionId, 'closed');

  // Emit audit event
  await auditQueue.add('audit.action', {
    actor: null,
    action: 'election.closed',
    target: 'election',
    targetId: electionId,
  });

  console.log(`Election ${electionId} closed`);
}
