import pool from '../db.js';

export const candidateRepository = {
  async insert(data) {
    const { electionId, userId, bio, post, phase, status, is_elected } = data;
    const result = await pool.query(
      `INSERT INTO election.candidates 
       (election_id, user_id, bio, post, phase, status, is_elected, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [
        electionId,
        userId,
        bio,
        post,
        phase !== undefined ? phase : 1,
        status !== undefined ? status : 'approved',
        is_elected !== undefined ? is_elected : false
      ]
    );
    return result.rows[0];
  },

  async findByElection(electionId, phase = null) {
    let queryStr = `
      SELECT c.*, u.name, u.email, u.batch_year
      FROM election.candidates c
      LEFT JOIN auth.users u ON c.user_id = u.user_id
      WHERE c.election_id = $1
    `;
    const params = [electionId];
    if (phase !== null) {
      queryStr += ` AND c.phase = $2`;
      params.push(phase);
    }
    queryStr += ` ORDER BY c.created_at ASC`;
    const result = await pool.query(queryStr, params);
    return result.rows;
  },

  async findById(candidateId) {
    const result = await pool.query(
      `SELECT * FROM election.candidates WHERE candidate_id = $1`,
      [candidateId]
    );
    return result.rows[0];
  },

  async findCandidateByUserAndPhase(electionId, userId, phase) {
    const result = await pool.query(
      `SELECT * FROM election.candidates WHERE election_id = $1 AND user_id = $2 AND phase = $3`,
      [electionId, userId, phase]
    );
    return result.rows[0];
  },

  async delete(candidateId) {
    const result = await pool.query(
      `DELETE FROM election.candidates WHERE candidate_id = $1 RETURNING *`,
      [candidateId]
    );
    return result.rows[0];
  },

  async update(candidateId, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.bio !== undefined) {
      fields.push(`bio = $${paramCount++}`);
      values.push(data.bio);
    }
    if (data.post !== undefined) {
      fields.push(`post = $${paramCount++}`);
      values.push(data.post);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(data.status);
    }
    if (data.is_elected !== undefined) {
      fields.push(`is_elected = $${paramCount++}`);
      values.push(data.is_elected);
    }

    if (fields.length === 0) {
      return null;
    }

    values.push(candidateId);
    const result = await pool.query(
      `UPDATE election.candidates SET ${fields.join(', ')} WHERE candidate_id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  },
};
