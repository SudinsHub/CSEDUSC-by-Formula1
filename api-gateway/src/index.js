import config from './config.js';        // validates env vars first
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { generalLimiter } from './middleware/rateLimiter.js';
import proxyRouter from './routes/proxy.js';

const app = express();

// ---------------------------------------------------------------------------
// Global middleware — order matters
// ---------------------------------------------------------------------------

app.use(helmet());

const allowedOrigins = config.frontendOrigin.split(',').map(o => o.trim());
app.use(
  cors({
    origin: (origin, cb) => {
      // allow non-browser requests (curl, Postman) and listed origins
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(morgan('combined'));

app.use(generalLimiter);

// ---------------------------------------------------------------------------
// Health check — no auth, no extra rate limit, not proxied
// ---------------------------------------------------------------------------

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ---------------------------------------------------------------------------
// Proxy routes
// ---------------------------------------------------------------------------

app.use(proxyRouter);

// ---------------------------------------------------------------------------
// 404 fallback (reached only if no proxy route matched)
// ---------------------------------------------------------------------------

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(config.port, () => {
  console.log(`API Gateway listening on port ${config.port}`);
});
