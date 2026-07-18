import pool from '../db.js';

export const budgetRepository = {
  async insert(data) {
    const { eventId, proposedBy, totalAmount, lineItems } = data;
    const result = await pool.query(
      `WITH inserted AS (
         INSERT INTO budgets (event_id, proposed_by, status, total_amount, line_items, submitted_at)
         VALUES ($1, $2, 'pending_review', $3, $4, NOW())
         RETURNING *
       )
       SELECT i.*, u.name AS proposed_by_name 
       FROM inserted i
       LEFT JOIN auth.users u ON i.proposed_by = u.user_id`,
      [eventId, proposedBy, totalAmount, JSON.stringify(lineItems)]
    );
    return result.rows[0];
  },

  async findAll() {
    const result = await pool.query(
      `SELECT b.*, u.name AS proposed_by_name 
       FROM budgets b
       LEFT JOIN auth.users u ON b.proposed_by = u.user_id
       ORDER BY b.submitted_at DESC`
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT b.*, u.name AS proposed_by_name 
       FROM budgets b
       LEFT JOIN auth.users u ON b.proposed_by = u.user_id
       WHERE b.budget_id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async updateStatus(id, status, adminId, comment) {
    const result = await pool.query(
      `WITH updated AS (
         UPDATE budgets 
         SET status = $1, reviewed_by = $2, admin_comment = $3, reviewed_at = NOW()
         WHERE budget_id = $4
         RETURNING *
       )
       SELECT up.*, u.name AS proposed_by_name 
       FROM updated up
       LEFT JOIN auth.users u ON up.proposed_by = u.user_id`,
      [status, adminId, comment, id]
    );
    return result.rows[0];
  },
};
