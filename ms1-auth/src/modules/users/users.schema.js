import { z } from 'zod';

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'REJECTED', 'REVOKED'], {
    errorMap: () => ({ message: "status must be one of: ACTIVE, REJECTED, REVOKED" }),
  }),
  reason: z.string().optional().nullable(),
});

export const updateRoleSchema = z.object({
  role: z.enum(['ECMember', 'Administrator'], {
    errorMap: () => ({ message: "role must be one of: ECMember, Administrator" }),
  }),
});

export const updateProfileSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .optional(),
  contactNo: z.string().max(20, 'Contact number is too long').optional().nullable(),
  profilePicture: z.string().optional().nullable(),
});
