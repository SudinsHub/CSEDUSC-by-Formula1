import express from 'express';
import { electionController } from './election.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  createElectionSchema,
  updateElectionSchema,
  addCandidateSchema,
  castVoteSchema,
  electionIdSchema,
  updateCandidateSchema,
  candidateIdSchema,
  transitionPhase2Schema,
  applyNominationSchema,
  updateCandidateStatusSchema,
} from './election.schema.js';

const router = express.Router();

// Election CRUD
router.post('/', validate(createElectionSchema), electionController.create);
router.get('/', electionController.list);
router.get('/:id', validate(electionIdSchema), electionController.getById);
router.patch('/:id', validate(updateElectionSchema), electionController.update);
router.delete('/:id', validate(electionIdSchema), electionController.delete);

// Candidate management
router.post('/:id/candidates', validate(addCandidateSchema), electionController.addCandidate);
router.get('/:id/candidates', validate(electionIdSchema), electionController.listCandidates);
router.patch('/:id/candidates/:candidateId', validate(updateCandidateSchema), electionController.updateCandidate);
router.delete('/:id/candidates/:candidateId', validate(candidateIdSchema), electionController.removeCandidate);
router.patch('/:id/candidates/:candidateId/status', validate(updateCandidateStatusSchema), electionController.updateCandidateStatus);

// Voting
router.post('/:id/vote', validate(castVoteSchema), electionController.castVote);

// Results
router.get('/:id/results', validate(electionIdSchema), electionController.getResults);
router.get('/:id/phase1-winners', validate(electionIdSchema), electionController.getPhase1Winners);

// Transition to Phase 2
router.post('/:id/transition', validate(transitionPhase2Schema), electionController.transitionToPhase2);

// Self-nomination & designation application
router.post('/:id/apply', validate(applyNominationSchema), electionController.applyNominationOrDesignation);

export default router;
