import { schedulerQueue } from '../queues/schedulerQueue.js';

export async function scheduleElection(election) {
  const now = Date.now();
  const startTime = new Date(election.start_time).getTime();
  const endTime = new Date(election.end_time).getTime();

  const openDelay = Math.max(0, startTime - now);
  const closeDelay = Math.max(0, endTime - now);

  // Enqueue delayed job to open election
  await schedulerQueue.add(
    `election:open:${election.election_id}`,
    { electionId: election.election_id, action: 'open' },
    { delay: openDelay }
  );

  // Enqueue delayed job to close election
  await schedulerQueue.add(
    `election:close:${election.election_id}`,
    { electionId: election.election_id, action: 'close' },
    { delay: closeDelay }
  );

  console.log(`Scheduled election ${election.election_id}: open in ${openDelay}ms, close in ${closeDelay}ms`);
}

export async function cancelSchedule(electionId) {
  // Remove pending jobs for this election
  const jobs = await schedulerQueue.getJobs(['delayed', 'waiting']);
  for (const job of jobs) {
    if (job.data.electionId === electionId) {
      await job.remove();
    }
  }
}
