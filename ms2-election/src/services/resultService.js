import { electionRepository } from '../repositories/electionRepository.js';
import { voteRepository } from '../repositories/voteRepository.js';

export const resultService = {
  async getResults(electionId) {
    const election = await electionRepository.findById(electionId);
    
    if (!election) {
      return { status: 404, message: 'Election not found' };
    }

    if (election.status !== 'closed') {
      return { 
        status: 403, 
        message: 'Results will be available after the election closes' 
      };
    }

    const tally = await voteRepository.countVotesByCandidate(electionId);

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
        },
        results: tally,
      },
    };
  },
};
