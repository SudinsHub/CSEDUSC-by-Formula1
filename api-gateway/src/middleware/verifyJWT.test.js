import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { verifyJWT, optionalVerifyJWT } from './verifyJWT.js';
import config from '../config.js';

describe('verifyJWT Middleware Unit Tests (api-gateway)', () => {
  const secret = config.jwtSecret || 'test-secret';

  it('should return 401 if Authorization header is missing', () => {
    const req = { headers: {} };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    verifyJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should populate req.userId and req.userRole if valid Bearer token is provided', () => {
    const token = jwt.sign({ userId: 42, role: 'admin' }, config.jwtSecret || secret);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {};
    const next = vi.fn();

    verifyJWT(req, res, next);

    expect(req.userId).toBe(42);
    expect(req.userRole).toBe('admin');
    expect(next).toHaveBeenCalled();
  });

  it('optionalVerifyJWT should proceed without error if no header is supplied', () => {
    const req = { headers: {} };
    const res = {};
    const next = vi.fn();

    optionalVerifyJWT(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.userId).toBeUndefined();
  });
});
