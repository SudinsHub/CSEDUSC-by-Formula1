import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema.js';

describe('Auth Schema Unit Tests (ms1-auth)', () => {
  describe('registerSchema', () => {
    it('should validate correct registration payload', () => {
      const validData = {
        name: 'Syed Naimul',
        email: 'naimul@csedu.ac.bd',
        password: 'securePassword123',
        batchYear: 2024,
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail when email is invalid', () => {
      const invalidData = {
        name: 'Syed Naimul',
        email: 'not-an-email',
        password: 'securePassword123',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email');
      }
    });

    it('should fail when password is less than 8 characters', () => {
      const invalidData = {
        name: 'Syed Naimul',
        email: 'naimul@csedu.ac.bd',
        password: 'short',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 8 characters');
      }
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login credentials', () => {
      const validData = {
        email: 'user@csedu.ac.bd',
        password: 'myPassword123',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail when password is empty', () => {
      const invalidData = {
        email: 'user@csedu.ac.bd',
        password: '',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('forgotPasswordSchema & resetPasswordSchema', () => {
    it('should validate forgot password request', () => {
      const result = forgotPasswordSchema.safeParse({ email: 'user@csedu.ac.bd' });
      expect(result.success).toBe(true);
    });

    it('should validate reset password with valid token and password', () => {
      const result = resetPasswordSchema.safeParse({
        token: 'valid-reset-token',
        newPassword: 'newSecretPassword123',
      });
      expect(result.success).toBe(true);
    });
  });
});
