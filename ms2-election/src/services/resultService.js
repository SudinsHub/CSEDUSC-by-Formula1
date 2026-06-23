import { electionRepository } from '../repositories/electionRepository.js';
import { voteRepository } from '../repositories/voteRepository.js';

export const resultService = {
  async getResults(electionId, requestedPhase = null) {
    const election = await electionRepository.findById(electionId);
    
    if (!election) {
      return { status: 404, message: 'Election not found' };
    }

    const phaseToTally = requestedPhase !== null ? parseInt(requestedPhase, 10) : election.phase;

    if (phaseToTally === 1) {
      if (election.phase === 1 && election.status !== 'closed') {
        return { 
          status: 403, 
          message: 'Phase 1 results will be available after the election phase closes' 
        };
      }
    } else if (phaseToTally === 2) {
      if (election.phase !== 2) {
        return {
          status: 400,
          message: 'Election has not entered Phase 2 yet'
        };
      }
      if (election.status !== 'closed') {
        return { 
          status: 403, 
          message: 'Phase 2 results will be available after the election closes' 
        };
      }
    } else {
      return { status: 400, message: 'Invalid phase requested' };
    }

    const tally = await voteRepository.countVotesByCandidate(electionId, phaseToTally);

    return {
      status: 200,
      data: {
        election: {
          election_id: election.election_id,
          title: election.title,
          phase: election.phase,
          status: election.status,
          start_time: election.start_time,
          end_time: election.end_time,
          batch_start_year: election.batch_start_year,
          batch_end_year: election.batch_end_year,
          representatives_per_batch: election.representatives_per_batch,
          designations: election.designations,
        },
        phase: phaseToTally,
        results: tally,
      },
    };
  },
};
