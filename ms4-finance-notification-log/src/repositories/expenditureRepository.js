import pool from '../db.js';

export const expenditureRepository = {
  async insert(data) {
    const { budgetId, category, amount, description, recordedBy } = data;
    const result = await pool.query(
      `INSERT INTO expenditures (budget_id, category, amount, description, recorded_at, recorded_by)
       VALUES ($1, $2, $3, $4, NOW(), $5)
       RETURNING *`,
      [budgetId, category, amount, description, recordedBy]
    );
    return result.rows[0];
  },

  async findByBudget(budgetId) {
    const result = await pool.query(
      `SELECT * FROM expenditures WHERE budget_id = $1 ORDER BY recorded_at DESC`,
      [budgetId]
    );
    return result.rows;
  },
};
