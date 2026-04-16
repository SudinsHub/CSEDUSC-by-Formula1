import { body, param, query } from 'express-validator';

export const submitBudgetSchema = [
  body('eventId')
    .isInt({ min: 1 })
    .withMessage('Event ID must be a positive integer'),
  body('totalAmount')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a non-negative number'),
  body('lineItems')
    .isArray({ min: 1 })
    .withMessage('Line items must be a non-empty array'),
  body('lineItems.*.category')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Each line item must have a category'),
  body('lineItems.*.estimatedCost')
    .isFloat({ min: 0 })
    .withMessage('Each line item must have a non-negative estimated cost'),
];

export const budgetIdSchema = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Budget ID must be a positive integer'),
];

export const approveBudgetSchema = [
  ...budgetIdSchema,
];

export const rejectBudgetSchema = [
  ...budgetIdSchema,
  body('comment')
    .optional()
    .isString()
    .trim()
    .withMessage('Comment must be a string'),
];

export const recordExpenditureSchema = [
  ...budgetIdSchema,
  body('category')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a non-negative number'),
  body('description')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
];

export const listLogsSchema = [
  query('actorUserId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Actor user ID must be a positive integer'),
  query('actionType')
    .optional()
    .isString()
    .trim()
    .withMessage('Action type must be a string'),
  query('targetEntity')
    .optional()
    .isString()
    .trim()
    .withMessage('Target entity must be a string'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
];
