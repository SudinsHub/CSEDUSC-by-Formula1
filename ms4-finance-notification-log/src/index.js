import './config.js'; // Validates env vars at startup — must be first
import express from 'express';
import { config } from './config.js';
import budgetRoutes from './modules/budget/budget.routes.js';
import logRoutes from './modules/log/log.routes.js';
import { startNotificationWorker } from './workers/notificationWorker.js';
import { startAuditWorker } from './workers/auditWorker.js';

const app = express();
const startTime = Date.now();

app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ms4-finance-notification-log',
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/budgets', budgetRoutes);
app.use('/api/logs', logRoutes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`Unhandled error at ${req.method} ${req.originalUrl}:`, err);
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Start workers ─────────────────────────────────────────────────────────────
startNotificationWorker();
startAuditWorker();

app.listen(config.port, () => {
  console.log(`ms4-finance-notification-log listening on port ${config.port}`);
});
