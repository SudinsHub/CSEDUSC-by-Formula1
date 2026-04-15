import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireRole } from '../../middleware/requireRole.js';
import * as authController from './auth.controller.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema.js';

const router = Router();

const ALL_ROLES = ['PublicVisitor', 'GeneralStudent', 'ECMember', 'Administrator'];

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', requireRole(ALL_ROLES), authController.logout);
router.get('/me', requireRole(ALL_ROLES), authController.me);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

export default router;
