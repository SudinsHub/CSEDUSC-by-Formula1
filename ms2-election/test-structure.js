// Simple structure verification script
import fs from 'fs';
import path from 'path';

const requiredFiles = [
  'package.json',
  'src/index.js',
  'src/config.js',
  'src/db.js',
  'src/repositories/electionRepository.js',
  'src/repositories/candidateRepository.js',
  'src/repositories/voteRepository.js',
  'src/services/electionService.js',
  'src/services/voteService.js',
  'src/services/candidateService.js',
  'src/services/resultService.js',
  'src/services/schedulerService.js',
  'src/queues/schedulerQueue.js',
  'src/queues/auditQueue.js',
  'src/queues/notificationQueue.js',
  'src/workers/electionSchedulerWorker.js',
  'src/modules/election/election.controller.js',
  'src/modules/election/election.routes.js',
  'src/modules/election/election.schema.js',
  'src/middleware/validate.js',
  'migrations/001_create_election_schema.sql',
];

console.log('Checking MS2 Election Service structure...\n');

let allPresent = true;
for (const file of requiredFiles) {
  const exists = fs.existsSync(file);
  const status = exists ? '✓' : '✗';
  console.log(`${status} ${file}`);
  if (!exists) allPresent = false;
}

console.log('\n' + (allPresent ? '✓ All required files present' : '✗ Some files missing'));
