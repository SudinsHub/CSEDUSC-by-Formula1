import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { validationResult } from 'express-validator';
import { submitBudgetSchema, recordExpenditureSchema } from './budget.schema.js';

function createTestApp(schema) {
  const app = express();
  app.use(express.json());
  app.post('/test/:id?', schema, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    return res.status(200).json({ success: true, body: req.body });
  });
  return app;
}

describe('Budget Schema Unit Tests (ms4-finance-notification-log)', () => {
  describe('submitBudgetSchema', () => {
    const app = createTestApp(submitBudgetSchema);

    it('should validate valid budget submission payload', async () => {
      const validPayload = {
        eventId: 1,
        totalAmount: 1500.50,
        lineItems: [
          { category: 'Decorations', amount: 500 },
          { category: 'Refreshments', amount: 1000 },
        ],
      };

      const res = await request(app).post('/test').send(validPayload);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should fail when eventId is not a positive integer', async () => {
      const invalidPayload = {
        eventId: -5,
        totalAmount: 100,
        lineItems: [{ category: 'Food', amount: 100 }],
      };

      const res = await request(app).post('/test').send(invalidPayload);
      expect(res.status).toBe(400);
    });
  });

  describe('recordExpenditureSchema', () => {
    const app = createTestApp(recordExpenditureSchema);

    it('should validate valid expenditure record', async () => {
      const validPayload = {
        category: 'Food',
        amount: 250,
        description: 'Snacks for participants',
      };

      const res = await request(app).post('/test/10').send(validPayload);
      expect(res.status).toBe(200);
    });

    it('should fail when category or description is empty', async () => {
      const invalidPayload = {
        category: '',
        amount: 250,
        description: '',
      };

      const res = await request(app).post('/test/10').send(invalidPayload);
      expect(res.status).toBe(400);
    });
  });
});
