import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireRole } from '../../middleware/requireRole.js';
import * as noticeController from './notice.controller.js';
import { createNoticeSchema, updateNoticeSchema } from './notice.schema.js';

const router = Router();

const EC_ADMIN = ['ECMember', 'Administrator'];

// Public routes
router.get('/', noticeController.list);
router.get('/:id', noticeController.getById);

// EC/Admin routes
router.post('/', requireRole(EC_ADMIN), validate(createNoticeSchema), noticeController.publish);
router.patch('/:id', requireRole(EC_ADMIN), validate(updateNoticeSchema), noticeController.update);

export default router;
