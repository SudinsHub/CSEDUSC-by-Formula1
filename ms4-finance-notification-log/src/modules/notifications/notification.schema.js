import { body, param } from 'express-validator';

export const contactSchema = [
  body('name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Name is required'),
  body('email')
    .isEmail()
    .withMessage('A valid email address is required'),
  body('message')
    .isString()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
];

export const pendingContactSchema = [
  body('name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Name is required'),
  body('email')
    .isEmail()
    .withMessage('A valid email address is required'),
  body('message')
    .isString()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
];

export const notificationIdSchema = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Notification ID must be a positive integer'),
];

export const sendCustomNotificationSchema = [
  body('recipientType')
    .isIn(['all', 'role', 'user'])
    .withMessage("recipientType must be one of: 'all', 'role', 'user'"),
  body('recipientValue')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('recipientValue is required'),
  body('deliveryMethod')
    .isIn(['email', 'in_app', 'both'])
    .withMessage("deliveryMethod must be one of: 'email', 'in_app', 'both'"),
  body('title')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Title is required'),
  body('message')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Message is required'),
];
