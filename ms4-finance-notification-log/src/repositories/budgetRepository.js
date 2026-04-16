import pool from '../db.js';

export const budgetRepository = {
  async insert(data) {
    const { eventId, proposedBy, totalAmount, lineItems } = data;
    const result = await pool.query(
      `INSERT INTO budgets (event_id, proposed_by, status, total_amount, line_items, submitted_at)
       VALUES ($1, $2, 'pending_review', $3, $4, NOW())
       RETURNING *`,
      [eventId, proposedBy, totalAmount, JSON.stringify(lineItems)]
    );
    return result.rows[0];
  },

  async findAll() {
    const result = await pool.query(
      `SELECT * FROM budgets ORDER BY submitted_at DESC`
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT * FROM budgets WHERE budget_id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async updateStatus(id, status, adminId, comment) {
    const result = await pool.query(
      `UPDATE budgets 
       SET status = $1, reviewed_by = $2, admin_comment = $3, reviewed_at = NOW()
       WHERE budget_id = $4
       RETURNING *`,
      [status, adminId, comment, id]
    );
    return result.rows[0];
  },
};
