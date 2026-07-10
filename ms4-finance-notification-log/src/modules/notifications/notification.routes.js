import express from 'express';
import { notificationController } from './notification.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  contactSchema,
  pendingContactSchema,
  notificationIdSchema,
  sendCustomNotificationSchema,
} from './notification.schema.js';

const router = express.Router();

// Public / Guest endpoints
router.post('/contact', contactSchema, validate, notificationController.contact);
router.post('/pending-contact', pendingContactSchema, validate, notificationController.pendingContact);

// Protected endpoints (routed via verifyJWT on Gateway)
router.get('/', notificationController.list);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationIdSchema, validate, notificationController.markRead);
router.delete('/:id', notificationIdSchema, validate, notificationController.delete);
router.post('/send-custom', sendCustomNotificationSchema, validate, notificationController.sendCustom);

export default router;
