import pool from '../db.js';

export const voteRepository = {
  /**
   * Check if a user has already voted in an election
   * Must be called within a transaction with FOR UPDATE
   */
  async checkVoteCastLog(electionId, userId, client) {
    const result = await client.query(
      `SELECT log_id FROM election.vote_cast_log
       WHERE election_id = $1 AND voter_user_id = $2
       FOR UPDATE`,
      [electionId, userId]
    );
    return result.rows.length > 0;
  },

  /**
   * Insert anonymous vote (no voter_user_id)
   */
  async insertVote(electionId, candidateId, client) {
    await client.query(
      `INSERT INTO election.votes (election_id, candidate_id, cast_at)
       VALUES ($1, $2, NOW())`,
      [electionId, candidateId]
    );
  },

  /**
   * Record who voted (no candidate_id)
   */
  async insertVoteCastLog(electionId, userId, client) {
    await client.query(
      `INSERT INTO election.vote_cast_log (election_id, voter_user_id, voted_at)
       VALUES ($1, $2, NOW())`,
      [electionId, userId]
    );
  },

  /**
   * Count votes by candidate for results
   */
  async countVotesByCandidate(electionId) {
    const result = await pool.query(
      `SELECT 
         v.candidate_id,
         c.user_id,
         c.bio,
         c.post,
         u.name,
         u.email,
         COUNT(v.vote_id) as vote_count
       FROM election.votes v
       JOIN election.candidates c ON v.candidate_id = c.candidate_id
       LEFT JOIN auth.users u ON c.user_id = u.user_id
       WHERE v.election_id = $1
       GROUP BY v.candidate_id, c.user_id, c.bio, c.post, u.name, u.email
       ORDER BY vote_count DESC`,
      [electionId]
    );
    return result.rows;
  },
};
