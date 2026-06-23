import pool from '../db.js';
import { voteRepository } from '../repositories/voteRepository.js';
import { candidateRepository } from '../repositories/candidateRepository.js';
import { auditQueue } from '../queues/auditQueue.js';

export const voteService = {
  /**
   * Cast a vote with full atomicity guarantees
   * Implements the critical algorithm from SDD Section 3.2.5
   */
  async castVote(electionId, userId, candidateIds) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Step 1: Lock the election row and verify it is active within its time window
      const electionRes = await client.query(
        `SELECT * FROM election.elections
         WHERE election_id = $1
           AND status = 'active'
           AND NOW() BETWEEN start_time AND end_time
         FOR UPDATE`,
        [electionId]
      );

      if (electionRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return { status: 400, message: 'Election is not currently active' };
      }

      const election = electionRes.rows[0];

      // Step 2: Check for a prior vote — lock the log row if it exists
      const hasVoted = await voteRepository.checkVoteCastLog(electionId, userId, election.phase, client);
      
      if (hasVoted) {
        await client.query('ROLLBACK');
        return { status: 409, message: `You have already voted in Phase ${election.phase} of this election` };
      }

      // Step 3: Get voter details and verify batch eligibility
      const voterRes = await client.query(
        `SELECT batch_year FROM auth.users WHERE user_id = $1`,
        [userId]
      );
      if (voterRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return { status: 404, message: 'Voter profile not found' };
      }
      const voter = voterRes.rows[0];
      const voterBatch = voter.batch_year;

      if (!voterBatch || voterBatch < election.batch_start_year || voterBatch > election.batch_end_year) {
        await client.query('ROLLBACK');
        return { status: 403, message: `Your batch (${voterBatch}) is not eligible to vote in this election` };
      }

      // Step 4: Validate candidate IDs based on the phase rules
      if (election.phase === 1) {
        // Phase 1 Rules:
        // - Voters can select between 1 and representatives_per_batch candidates.
        const maxVotes = election.representatives_per_batch || 5;
        if (candidateIds.length < 1 || candidateIds.length > maxVotes) {
          await client.query('ROLLBACK');
          return { status: 400, message: `You can vote for 1 to ${maxVotes} candidates` };
        }

        // - All candidates must be approved Phase 1 candidates of this election.
        // - Candidate's batch_year must match voter's batch_year.
        for (const cid of candidateIds) {
          const candidate = await candidateRepository.findById(cid);
          if (!candidate || candidate.election_id !== electionId || candidate.phase !== 1 || candidate.status !== 'approved') {
            await client.query('ROLLBACK');
            return { status: 400, message: `Invalid candidate ID: ${cid}` };
          }

          const candUserRes = await client.query(
            `SELECT batch_year FROM auth.users WHERE user_id = $1`,
            [candidate.user_id]
          );
          const candUser = candUserRes.rows[0];
          if (!candUser || candUser.batch_year !== voterBatch) {
            await client.query('ROLLBACK');
            return { status: 400, message: 'You can only vote for candidates from your own batch' };
          }
        }
      } else {
        // Phase 2 Rules:
        // - All candidates must be Phase 2 candidates of this election.
        // - Voter can select up to the elect_count for each designation.
        const designations = election.designations || [];
        const designationVotesCount = {};

        for (const cid of candidateIds) {
          const candidate = await candidateRepository.findById(cid);
          if (!candidate || candidate.election_id !== electionId || candidate.phase !== 2) {
            await client.query('ROLLBACK');
            return { status: 400, message: `Invalid candidate ID: ${cid}` };
          }

          const designationName = candidate.post;
          const matchedDesignation = designations.find(d => d.name === designationName);
          if (!matchedDesignation) {
            await client.query('ROLLBACK');
            return { status: 400, message: `Candidate runs for invalid designation: '${designationName}'` };
          }

          designationVotesCount[designationName] = (designationVotesCount[designationName] || 0) + 1;
        }

        // Validate count limits per designation
        for (const [desigName, count] of Object.entries(designationVotesCount)) {
          const matchedDesignation = designations.find(d => d.name === desigName);
          const maxAllowed = matchedDesignation ? matchedDesignation.elect_count : 1;
          if (count > maxAllowed) {
            await client.query('ROLLBACK');
            return { status: 400, message: `You can cast at most ${maxAllowed} votes for '${desigName}'` };
          }
        }
      }

      // Step 5: Record the votes and cast logs atomically
      for (const candidateId of candidateIds) {
        await voteRepository.insertVote(electionId, candidateId, election.phase, client);
      }
      await voteRepository.insertVoteCastLog(electionId, userId, election.phase, client);

      await client.query('COMMIT');

      // Step 6: Async audit log
      await auditQueue.add('audit.action', {
        actor: userId,
        action: 'vote.cast',
        target: 'election',
        targetId: electionId,
      });

      return { status: 200, message: 'Vote recorded successfully' };

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async hasVoted(electionId, userId, phase = 1) {
    const result = await pool.query(
      `SELECT log_id FROM election.vote_cast_log
       WHERE election_id = $1 AND voter_user_id = $2 AND phase = $3`,
      [electionId, userId, phase]
    );
    return result.rows.length > 0;
  },
};
