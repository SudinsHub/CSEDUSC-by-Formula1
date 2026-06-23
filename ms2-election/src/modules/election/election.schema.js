import { body, param } from 'express-validator';

export const createElectionSchema = [
  body('title').isString().trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 chars)'),
  body('phase').isInt({ min: 1, max: 2 }).withMessage('Phase must be 1 or 2'),
  body('rules').optional().isString().withMessage('Rules must be a string'),
  body('maxVotesPerUser').isInt({ min: 1 }).withMessage('Max votes per user must be at least 1'),
  body('startTime').isISO8601().withMessage('Start time must be a valid ISO 8601 date'),
  body('endTime').isISO8601().withMessage('End time must be a valid ISO 8601 date'),
  body('batchStartYear').isInt({ min: 1900, max: 2100 }).withMessage('Batch start year must be a valid year'),
  body('batchEndYear').isInt({ min: 1900, max: 2100 }).withMessage('Batch end year must be a valid year'),
  body('representativesPerBatch').optional().isInt({ min: 1 }).withMessage('Representatives per batch must be at least 1'),
];

export const updateElectionSchema = [
  param('id').isInt().withMessage('Election ID must be an integer'),
  body('title').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('phase').optional().isInt({ min: 1, max: 2 }),
  body('rules').optional().isString(),
  body('maxVotesPerUser').optional().isInt({ min: 1 }),
  body('startTime').optional().isISO8601(),
  body('endTime').optional().isISO8601(),
  body('batchStartYear').optional().isInt({ min: 1900, max: 2100 }),
  body('batchEndYear').optional().isInt({ min: 1900, max: 2100 }),
  body('representativesPerBatch').optional().isInt({ min: 1 }),
];

export const addCandidateSchema = [
  param('id').isInt().withMessage('Election ID must be an integer'),
  body('userId').isInt().withMessage('User ID is required'),
  body('bio').isString().trim().withMessage('Bio is required'),
  body('post').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Post is required (max 100 chars)'),
];

export const castVoteSchema = [
  param('id').isInt().withMessage('Election ID must be an integer'),
  body('candidateIds').isArray({ min: 1 }).withMessage('Candidate IDs must be an array of integers'),
  body('candidateIds.*').isInt().withMessage('Candidate IDs must be integers'),
];

export const electionIdSchema = [
  param('id').isInt().withMessage('Election ID must be an integer'),
];

export const updateCandidateSchema = [
  param('id').isInt().withMessage('Election ID must be an integer'),
  param('candidateId').isInt().withMessage('Candidate ID must be an integer'),
  body('bio').optional().isString().trim().withMessage('Bio must be a string'),
  body('post').optional().isString().trim().isLength({ min: 1, max: 100 }).withMessage('Post must be a string (max 100 chars)'),
];

export const candidateIdSchema = [
  param('id').isInt().withMessage('Election ID must be an integer'),
  param('candidateId').isInt().withMessage('Candidate ID must be an integer'),
];

export const transitionPhase2Schema = [
  param('id').isInt().withMessage('Election ID must be an integer'),
  body('startTime').isISO8601().withMessage('Start time must be a valid ISO 8601 date'),
  body('endTime').isISO8601().withMessage('End time must be a valid ISO 8601 date'),
  body('designations').isArray({ min: 1 }).withMessage('Designations must be a non-empty array of objects'),
  body('designations.*.name').isString().trim().isLength({ min: 1 }).withMessage('Designation name is required'),
  body('designations.*.elect_count').isInt({ min: 1 }).withMessage('Elect count must be at least 1'),
  body('candidates').isArray().withMessage('Candidates list must be an array of user IDs'),
  body('candidates.*').isInt().withMessage('Candidates must be integers'),
];

export const applyNominationSchema = [
  param('id').isInt().withMessage('Election ID must be an integer'),
  body('bio').isString().trim().isLength({ min: 1 }).withMessage('Biography is required'),
  body('designation').optional().isString().trim().withMessage('Designation must be a string'),
];

export const updateCandidateStatusSchema = [
  param('id').isInt().withMessage('Election ID must be an integer'),
  param('candidateId').isInt().withMessage('Candidate ID must be an integer'),
  body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Status must be pending, approved, or rejected'),
];

