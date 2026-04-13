import { z } from 'zod';

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'REJECTED', 'REVOKED'], {
    errorMap: () => ({ message: "status must be one of: ACTIVE, REJECTED, REVOKED" }),
  }),
});

export const updateRoleSchema = z.object({
  role: z.enum(['ECMember', 'Administrator'], {
    errorMap: () => ({ message: "role must be one of: ECMember, Administrator" }),
  }),
});
