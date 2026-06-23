import pool from '../db.js';

export const voteRepository = {
  /**
   * Check if a user has already voted in an election
   * Must be called within a transaction with FOR UPDATE
   */
  async checkVoteCastLog(electionId, userId, phase, client) {
    const result = await client.query(
      `SELECT log_id FROM election.vote_cast_log
       WHERE election_id = $1 AND voter_user_id = $2 AND phase = $3
       FOR UPDATE`,
      [electionId, userId, phase]
    );
    return result.rows.length > 0;
  },

  /**
   * Insert anonymous vote (no voter_user_id)
   */
  async insertVote(electionId, candidateId, phase, client) {
    await client.query(
      `INSERT INTO election.votes (election_id, candidate_id, phase, cast_at)
       VALUES ($1, $2, $3, NOW())`,
      [electionId, candidateId, phase]
    );
  },

  /**
   * Record who voted (no candidate_id)
   */
  async insertVoteCastLog(electionId, userId, phase, client) {
    await client.query(
      `INSERT INTO election.vote_cast_log (election_id, voter_user_id, phase, voted_at)
       VALUES ($1, $2, $3, NOW())`,
      [electionId, userId, phase]
    );
  },

  /**
   * Count votes by candidate for results
   */
  async countVotesByCandidate(electionId, phase = null) {
    let queryStr = `
      SELECT 
         c.candidate_id,
         c.user_id,
         c.bio,
         c.post,
         c.status,
         c.is_elected,
         u.name,
         u.email,
         u.batch_year,
         COUNT(v.vote_id) as vote_count
       FROM election.candidates c
       LEFT JOIN election.votes v ON c.candidate_id = v.candidate_id
       LEFT JOIN auth.users u ON c.user_id = u.user_id
       WHERE c.election_id = $1 AND c.status = 'approved'
    `;
    const params = [electionId];
    if (phase !== null) {
      queryStr += ` AND c.phase = $2`;
      params.push(phase);
    }
    queryStr += `
       GROUP BY c.candidate_id, c.user_id, c.bio, c.post, c.status, c.is_elected, u.name, u.email, u.batch_year
       ORDER BY vote_count DESC
    `;
    const result = await pool.query(queryStr, params);
    return result.rows;
  },
};
