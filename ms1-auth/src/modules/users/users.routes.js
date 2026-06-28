import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireRole } from '../../middleware/requireRole.js';
import * as usersController from './users.controller.js';
import { updateStatusSchema, updateRoleSchema, updateProfileSchema } from './users.schema.js';

const router = Router();
const ALL_ROLES = ['GeneralStudent', 'ECMember', 'Administrator'];

router.get('/', requireRole(['Administrator', 'ECMember']), usersController.listUsers);
router.patch('/profile', requireRole(ALL_ROLES), validate(updateProfileSchema), usersController.updateProfile);
router.delete('/profile', requireRole(ALL_ROLES), usersController.deleteAccount);
router.get('/:userId', requireRole(['Administrator']), usersController.getUser);
router.patch('/:userId/status', requireRole(['Administrator']), validate(updateStatusSchema), usersController.updateStatus);
router.patch('/:userId/role', requireRole(['Administrator']), validate(updateRoleSchema), usersController.updateRole);

export default router;
