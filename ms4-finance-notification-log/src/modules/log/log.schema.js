import { query } from 'express-validator';

export const listLogsSchema = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000')
    .toInt(),
  query('actorUserId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Actor user ID must be a positive integer')
    .toInt(),
  query('actionType')
    .optional()
    .isString()
    .trim()
    .withMessage('Action type must be a string'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('search')
    .optional()
    .isString()
    .trim()
    .withMessage('Search query must be a string'),
];

export const deleteLogsSchema = [
  query('beforeDate')
    .optional()
    .isISO8601()
    .withMessage('Before date must be a valid ISO 8601 date'),
  query('actorUserId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Actor user ID must be a positive integer')
    .toInt(),
  query('actionType')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Action type must be a non-empty string'),
];
