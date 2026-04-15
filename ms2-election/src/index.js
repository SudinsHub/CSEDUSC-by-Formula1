import './config.js'; // Validates env vars at startup — must be first
import express from 'express';
import { config } from './config.js';
import electionRoutes from './modules/election/election.routes.js';
import { startSchedulerWorker } from './workers/electionSchedulerWorker.js';

const app = express();
const startTime = Date.now();

app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ms2-election',
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/elections', electionRoutes);

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Start scheduler worker ────────────────────────────────────────────────────
startSchedulerWorker();

app.listen(config.port, () => {
  console.log(`ms2-election listening on port ${config.port}`);
});
