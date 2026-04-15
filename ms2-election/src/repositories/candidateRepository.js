import pool from '../db.js';

export const candidateRepository = {
  async insert(data) {
    const { electionId, userId, bio, post } = data;
    const result = await pool.query(
      `INSERT INTO election.candidates 
       (election_id, user_id, bio, post, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [electionId, userId, bio, post]
    );
    return result.rows[0];
  },

  async findByElection(electionId) {
    const result = await pool.query(
      `SELECT c.*, u.name, u.email, u.batch_year
       FROM election.candidates c
       LEFT JOIN auth.users u ON c.user_id = u.user_id
       WHERE c.election_id = $1
       ORDER BY c.created_at ASC`,
      [electionId]
    );
    return result.rows;
  },

  async findById(candidateId) {
    const result = await pool.query(
      `SELECT * FROM election.candidates WHERE candidate_id = $1`,
      [candidateId]
    );
    return result.rows[0];
  },
};
