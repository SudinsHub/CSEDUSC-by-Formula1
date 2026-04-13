import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .email('Invalid email address')
    .refine(
      (val) => val.endsWith('@cs.du.ac.bd') || val.endsWith('@cse.du.ac.bd'),
      { message: 'Email must be a @cs.du.ac.bd or @cse.du.ac.bd address' }
    ),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  batch_year: z
    .number()
    .int()
    .gte(1000, 'batch_year must be a 4-digit year')
    .lte(9999, 'batch_year must be a 4-digit year'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});
