import './config.js'; // Validates env vars at startup — must be first
import express from 'express';
import { config } from './config.js';
import eventRoutes from './modules/event/event.routes.js';
import noticeRoutes from './modules/notice/notice.routes.js';
import mediaRoutes from './modules/media/media.routes.js';

const app = express();
const startTime = Date.now();

app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ms3-event-notice-media',
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/events', eventRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/media', mediaRoutes);

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Global error handler]', err);
  
  if (err.message && err.message.includes('File type')) {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ 
      error: `File too large. Maximum size is ${config.upload.maxSizeMB}MB` 
    });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`ms3-event-notice-media listening on port ${config.port}`);
});
