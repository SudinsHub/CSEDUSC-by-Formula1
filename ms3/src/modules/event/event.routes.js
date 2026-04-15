import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireRole } from '../../middleware/requireRole.js';
import * as eventController from './event.controller.js';
import {
  createEventSchema,
  updateEventSchema,
  manageVolunteerSchema,
} from './event.schema.js';

const router = Router();

const EC_ADMIN = ['ECMember', 'Administrator'];
const STUDENT_PLUS = ['GeneralStudent', 'ECMember', 'Administrator'];

// Public routes
router.get('/', eventController.list);
router.get('/:id', eventController.getById);

// EC/Admin routes
router.post('/', requireRole(EC_ADMIN), validate(createEventSchema), eventController.create);
router.patch('/:id', requireRole(EC_ADMIN), validate(updateEventSchema), eventController.update);
router.delete('/:id', requireRole(EC_ADMIN), eventController.cancel);
router.get('/:id/registrations', requireRole(EC_ADMIN), eventController.listRegistrations);
router.patch('/:id/volunteers/:vid', requireRole(EC_ADMIN), validate(manageVolunteerSchema), eventController.manageVolunteer);

// Student routes
router.post('/:id/register', requireRole(STUDENT_PLUS), eventController.registerAttendee);
router.post('/:id/volunteer', requireRole(STUDENT_PLUS), eventController.applyVolunteer);

export default router;
