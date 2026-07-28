import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { validationResult } from 'express-validator';
import { createElectionSchema, castVoteSchema } from './election.schema.js';

function createTestApp(schema) {
  const app = express();
  app.use(express.json());
  app.post('/test/:id?', schema, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    return res.status(200).json({ success: true });
  });
  return app;
}

describe('Election Schema Validation Unit Tests (ms2-election)', () => {
  describe('createElectionSchema', () => {
    const app = createTestApp(createElectionSchema);

    it('should pass with valid election payload', async () => {
      const validPayload = {
        title: 'Executive Committee Election 2026',
        phase: 1,
        maxVotesPerUser: 5,
        startTime: '2026-08-01T00:00:00.000Z',
        endTime: '2026-08-05T00:00:00.000Z',
        batchStartYear: 2020,
        batchEndYear: 2024,
      };

      const res = await request(app).post('/test').send(validPayload);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should fail when title is missing or phase is invalid', async () => {
      const invalidPayload = {
        title: '',
        phase: 99,
        startTime: 'invalid-date',
      };

      const res = await request(app).post('/test').send(invalidPayload);
      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('castVoteSchema', () => {
    const app = createTestApp(castVoteSchema);

    it('should pass with valid candidateIds', async () => {
      const res = await request(app)
        .post('/test/1')
        .send({ candidateIds: [10, 12, 15] });

      expect(res.status).toBe(200);
    });

    it('should fail when candidateIds is empty or not an array', async () => {
      const res = await request(app)
        .post('/test/1')
        .send({ candidateIds: [] });

      expect(res.status).toBe(400);
    });
  });
});
