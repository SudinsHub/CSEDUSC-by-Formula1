import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import config from '../config.js';
import { verifyJWT } from '../middleware/verifyJWT.js';
import { authLimiter, voteLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// NOTE: Express 5 (path-to-regexp v8) requires named wildcards — `/*path` not `/*`.
/**
 * Returns http-proxy-middleware options targeting `targetUrl`.
 * Injects x-user-id / x-user-role from req into the outgoing proxy request
 * and handles downstream failures gracefully.
 */
function proxyOptions(targetUrl) {
  return {
    target: targetUrl,
    changeOrigin: true,
    on: {
      proxyReq(proxyReq, req) {
        if (req.userId != null) {
          proxyReq.setHeader('x-user-id', req.userId);
        }
        if (req.userRole != null) {
          proxyReq.setHeader('x-user-role', req.userRole);
        }
      },
      error(_err, _req, res) {
        res.status(503).json({ error: 'Service unavailable' });
      },
    },
  };
}

// ---------------------------------------------------------------------------
// MS1 — User & Auth  (http://localhost:3001)
// ---------------------------------------------------------------------------

// Public auth routes
router.post('/api/auth/register',       createProxyMiddleware(proxyOptions(config.ms1Url)));
router.post('/api/auth/login',          authLimiter, createProxyMiddleware(proxyOptions(config.ms1Url)));
router.post('/api/auth/forgot-password',createProxyMiddleware(proxyOptions(config.ms1Url)));
router.post('/api/auth/reset-password', createProxyMiddleware(proxyOptions(config.ms1Url)));

// Protected auth routes
router.post('/api/auth/logout', verifyJWT, createProxyMiddleware(proxyOptions(config.ms1Url)));
router.get('/api/auth/me',     verifyJWT, createProxyMiddleware(proxyOptions(config.ms1Url)));

// Protected user management routes
router.get('/api/users',    verifyJWT, createProxyMiddleware(proxyOptions(config.ms1Url)));
router.get('/api/users/*path',  verifyJWT, createProxyMiddleware(proxyOptions(config.ms1Url)));
router.patch('/api/users',      verifyJWT, createProxyMiddleware(proxyOptions(config.ms1Url)));
router.patch('/api/users/*path',verifyJWT, createProxyMiddleware(proxyOptions(config.ms1Url)));

// ---------------------------------------------------------------------------
// MS2 — Elections  (http://localhost:3002)
// ---------------------------------------------------------------------------

// Public — MS2 handles its own public/private data split
router.get('/api/elections',   createProxyMiddleware(proxyOptions(config.ms2Url)));
router.get('/api/elections/*path', createProxyMiddleware(proxyOptions(config.ms2Url)));

// Protected — vote rate limiter keyed on x-user-id (set by verifyJWT)
router.post(
  '/api/elections/*path',
  verifyJWT,
  voteLimiter,
  createProxyMiddleware(proxyOptions(config.ms2Url))
);
router.patch('/api/elections',       verifyJWT, createProxyMiddleware(proxyOptions(config.ms2Url)));
router.patch('/api/elections/*path', verifyJWT, createProxyMiddleware(proxyOptions(config.ms2Url)));

// ---------------------------------------------------------------------------
// MS3 — Events & Notices  (http://localhost:3003)
// ---------------------------------------------------------------------------

// Events
router.get('/api/events',     createProxyMiddleware(proxyOptions(config.ms3Url)));
router.get('/api/events/*path',    createProxyMiddleware(proxyOptions(config.ms3Url)));
router.post('/api/events',         verifyJWT, createProxyMiddleware(proxyOptions(config.ms3Url)));
router.post('/api/events/*path',   verifyJWT, createProxyMiddleware(proxyOptions(config.ms3Url)));
router.patch('/api/events',        verifyJWT, createProxyMiddleware(proxyOptions(config.ms3Url)));
router.patch('/api/events/*path',  verifyJWT, createProxyMiddleware(proxyOptions(config.ms3Url)));
router.delete('/api/events',       verifyJWT, createProxyMiddleware(proxyOptions(config.ms3Url)));
router.delete('/api/events/*path', verifyJWT, createProxyMiddleware(proxyOptions(config.ms3Url)));

// Notices
router.get('/api/notices',         createProxyMiddleware(proxyOptions(config.ms3Url)));
router.get('/api/notices/*path',   createProxyMiddleware(proxyOptions(config.ms3Url)));
router.post('/api/notices',        verifyJWT, createProxyMiddleware(proxyOptions(config.ms3Url)));
router.post('/api/notices/*path',  verifyJWT, createProxyMiddleware(proxyOptions(config.ms3Url)));

// ---------------------------------------------------------------------------
// MS4 — Finance, Notifications & Logging  (http://localhost:3004)
// ---------------------------------------------------------------------------

router.get('/api/finance',    verifyJWT, createProxyMiddleware(proxyOptions(config.ms4Url)));
router.get('/api/finance/*path',  verifyJWT, createProxyMiddleware(proxyOptions(config.ms4Url)));
router.post('/api/finance',       verifyJWT, createProxyMiddleware(proxyOptions(config.ms4Url)));
router.post('/api/finance/*path', verifyJWT, createProxyMiddleware(proxyOptions(config.ms4Url)));

router.get('/api/logs',       verifyJWT, createProxyMiddleware(proxyOptions(config.ms4Url)));
router.get('/api/logs/*path', verifyJWT, createProxyMiddleware(proxyOptions(config.ms4Url)));

export default router;
