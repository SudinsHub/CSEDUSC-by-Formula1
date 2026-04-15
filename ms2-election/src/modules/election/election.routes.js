import express from 'express';
import { electionController } from './election.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  createElectionSchema,
  updateElectionSchema,
  addCandidateSchema,
  castVoteSchema,
  electionIdSchema,
} from './election.schema.js';

const router = express.Router();

// Election CRUD
router.post('/', validate(createElectionSchema), electionController.create);
router.get('/', electionController.list);
router.get('/:id', validate(electionIdSchema), electionController.getById);
router.patch('/:id', validate(updateElectionSchema), electionController.update);

// Candidate management
router.post('/:id/candidates', validate(addCandidateSchema), electionController.addCandidate);
router.get('/:id/candidates', validate(electionIdSchema), electionController.listCandidates);

// Voting
router.post('/:id/vote', validate(castVoteSchema), electionController.castVote);

// Results
router.get('/:id/results', validate(electionIdSchema), electionController.getResults);

export default router;
