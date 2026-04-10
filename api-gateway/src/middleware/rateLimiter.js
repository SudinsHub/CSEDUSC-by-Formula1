import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

export const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  // Key on x-user-id header (set by verifyJWT before this runs)
  keyGenerator: (req) => req.headers['x-user-id'] ?? ipKeyGenerator(req),
  message: { error: 'Too many requests, please try again later.' },
});
