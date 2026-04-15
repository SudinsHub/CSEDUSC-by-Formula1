import pool from '../db.js';

export const electionRepository = {
  async insert(data) {
    const { title, phase, status, rules, maxVotesPerUser, startTime, endTime, createdBy } = data;
    const result = await pool.query(
      `INSERT INTO election.elections 
       (title, phase, status, rules, max_votes_per_user, start_time, end_time, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [title, phase, status, rules, maxVotesPerUser, startTime, endTime, createdBy]
    );
    return result.rows[0];
  },

  async findAll() {
    const result = await pool.query(
      `SELECT * FROM election.elections ORDER BY created_at DESC`
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT * FROM election.elections WHERE election_id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(data.title);
    }
    if (data.phase !== undefined) {
      fields.push(`phase = $${paramCount++}`);
      values.push(data.phase);
    }
    if (data.rules !== undefined) {
      fields.push(`rules = $${paramCount++}`);
      values.push(data.rules);
    }
    if (data.maxVotesPerUser !== undefined) {
      fields.push(`max_votes_per_user = $${paramCount++}`);
      values.push(data.maxVotesPerUser);
    }
    if (data.startTime !== undefined) {
      fields.push(`start_time = $${paramCount++}`);
      values.push(data.startTime);
    }
    if (data.endTime !== undefined) {
      fields.push(`end_time = $${paramCount++}`);
      values.push(data.endTime);
    }

    if (fields.length === 0) {
      return null;
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE election.elections SET ${fields.join(', ')} WHERE election_id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE election.elections SET status = $1 WHERE election_id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  },
};
