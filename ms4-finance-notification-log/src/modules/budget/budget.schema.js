import { body, param, query } from 'express-validator';

export const submitBudgetSchema = [
  body('eventId')
    .isInt({ min: 1 })
    .withMessage('Event ID must be a positive integer'),
  body('totalAmount')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a non-negative number'),
  body('lineItems')
    .isArray()
    .withMessage('Line items must be an array')
    .customSanitizer((value) => {
      if (!Array.isArray(value)) return [];
      return value
        .map((item) => {
          if (!item || typeof item !== 'object') return null;
          const category = typeof item.category === 'string' ? item.category.trim() : (item.category ? String(item.category).trim() : '');
          const amount = parseInt(item.amount, 10);
          return { category, amount };
        })
        .filter((item) => item !== null && item.category !== '' && !isNaN(item.amount) && item.amount > 0);
    }),
  body('lineItems.*.category')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Each line item must have a category'),
  body('lineItems.*.amount')
    .isInt({ min: 1 })
    .withMessage('Each line item must have a positive integer amount'),
  body('notifyAdmins')
    .optional()
    .isBoolean()
    .withMessage('notifyAdmins must be a boolean'),
  body('adminMessage')
    .optional()
    .isString()
    .trim()
    .withMessage('adminMessage must be a string'),
];

export const budgetIdSchema = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Budget ID must be a positive integer'),
];

export const approveBudgetSchema = [
  ...budgetIdSchema,
  body('notifyRequester')
    .optional()
    .isBoolean()
    .withMessage('notifyRequester must be a boolean'),
  body('customMessage')
    .optional()
    .isString()
    .trim()
    .withMessage('customMessage must be a string'),
];

export const rejectBudgetSchema = [
  ...budgetIdSchema,
  body('comment')
    .optional()
    .isString()
    .trim()
    .withMessage('Comment must be a string'),
  body('notifyRequester')
    .optional()
    .isBoolean()
    .withMessage('notifyRequester must be a boolean'),
  body('customMessage')
    .optional()
    .isString()
    .trim()
    .withMessage('customMessage must be a string'),
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
