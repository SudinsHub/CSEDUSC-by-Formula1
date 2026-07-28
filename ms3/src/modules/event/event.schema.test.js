import { describe, it, expect } from 'vitest';
import { createEventSchema, updateEventSchema } from './event.schema.js';

describe('Event Schema Unit Tests (ms3 - Joi)', () => {
  describe('createEventSchema', () => {
    it('should validate a valid event payload', () => {
      const validPayload = {
        title: 'Intra CSE Programming Contest 2026',
        description: 'Annual programming contest for all batches.',
        event_date: '2026-09-15T09:00:00.000Z',
        location: 'CSE Department Lab 1',
        volunteers_needed: 5,
        registration_fee: 100,
      };

      const { error, value } = createEventSchema.validate(validPayload);
      expect(error).toBeUndefined();
      expect(value.title).toBe(validPayload.title);
    });

    it('should fail when required title is missing', () => {
      const invalidPayload = {
        description: 'Missing title event',
        event_date: '2026-09-15T09:00:00.000Z',
        location: 'Lab 1',
      };

      const { error } = createEventSchema.validate(invalidPayload);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('"title" is required');
    });
  });

  describe('updateEventSchema', () => {
    it('should require at least one field to update', () => {
      const { error } = updateEventSchema.validate({});
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('must have at least 1 key');
    });

    it('should validate partial updates successfully', () => {
      const { error } = updateEventSchema.validate({ location: 'Auditorium' });
      expect(error).toBeUndefined();
    });
  });
});
