import pool from '../db.js';
import { voteRepository } from '../repositories/voteRepository.js';
import { candidateRepository } from '../repositories/candidateRepository.js';
import { auditQueue } from '../queues/auditQueue.js';

export const voteService = {
  /**
   * Cast a vote with full atomicity guarantees
   * Implements the critical algorithm from SDD Section 3.2.5
   */
  async castVote(electionId, userId, candidateId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Step 1: Lock the election row and verify it is active within its time window
      const electionRes = await client.query(
        `SELECT election_id FROM election.elections
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

      // Step 2: Check for a prior vote — lock the log row if it exists
      const hasVoted = await voteRepository.checkVoteCastLog(electionId, userId, client);
      
      if (hasVoted) {
        await client.query('ROLLBACK');
        return { status: 409, message: 'You have already voted in this election' };
      }

      // Step 3: Validate the candidate belongs to this election
      const candidate = await candidateRepository.findById(candidateId);
      if (!candidate || candidate.election_id !== electionId) {
        await client.query('ROLLBACK');
        return { status: 404, message: 'Invalid candidate for this election' };
      }

      // Step 4: Insert the anonymous vote (no voter_user_id)
      await voteRepository.insertVote(electionId, candidateId, client);

      // Step 5: Record who voted (no candidate_id)
      await voteRepository.insertVoteCastLog(electionId, userId, client);

      await client.query('COMMIT');

      // Step 6: Async audit log (outside transaction — fire-and-forget)
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
};
