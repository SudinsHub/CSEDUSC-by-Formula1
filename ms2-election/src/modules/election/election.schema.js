import { body, param } from 'express-validator';

export const createElectionSchema = [
  body('title').isString().trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 chars)'),
  body('phase').isInt({ min: 1, max: 2 }).withMessage('Phase must be 1 or 2'),
  body('rules').optional().isString().withMessage('Rules must be a string'),
  body('maxVotesPerUser').isInt({ min: 1 }).withMessage('Max votes per user must be at least 1'),
  body('startTime').isISO8601().withMessage('Start time must be a valid ISO 8601 date'),
  body('endTime').isISO8601().withMessage('End time must be a valid ISO 8601 date'),
];

export const updateElectionSchema = [
  param('id').isInt().withMessage('Election ID must be an integer'),
  body('title').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('phase').optional().isInt({ min: 1, max: 2 }),
  body('rules').optional().isString(),
  body('maxVotesPerUser').optional().isInt({ min: 1 }),
  body('startTime').optional().isISO8601(),
  body('endTime').optional().isISO8601(),
];

export const addCandidateSchema = [
  param('id').isInt().withMessage('Election ID must be an integer'),
  body('userId').isInt().withMessage('User ID is required'),
  body('bio').isString().trim().withMessage('Bio is required'),
  body('post').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Post is required (max 100 chars)'),
];

export const castVoteSchema = [
  param('id').isInt().withMessage('Election ID must be an integer'),
  body('candidateId').isInt().withMessage('Candidate ID is required'),
];

export const electionIdSchema = [
  param('id').isInt().withMessage('Election ID must be an integer'),
];
