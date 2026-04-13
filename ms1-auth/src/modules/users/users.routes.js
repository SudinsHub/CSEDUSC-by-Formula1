import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireRole } from '../../middleware/requireRole.js';
import * as usersController from './users.controller.js';
import { updateStatusSchema, updateRoleSchema } from './users.schema.js';

const router = Router();

router.get('/', requireRole(['Administrator']), usersController.listUsers);
router.get('/:userId', requireRole(['Administrator']), usersController.getUser);
router.patch('/:userId/status', requireRole(['Administrator']), validate(updateStatusSchema), usersController.updateStatus);
router.patch('/:userId/role', requireRole(['Administrator']), validate(updateRoleSchema), usersController.updateRole);

export default router;
