import { query } from '../../db.js';

const VALID_STATUSES = ['PENDING', 'ACTIVE', 'REJECTED', 'REVOKED'];
const VALID_ROLES = ['GeneralStudent', 'ECMember', 'Administrator'];

export const listUsers = async ({ status, role, page, limit }) => {
  const conditions = [];
  const params = [];

  if (status && VALID_STATUSES.includes(status)) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  if (role && VALID_ROLES.includes(role)) {
    params.push(role);
    conditions.push(`role = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*) FROM users ${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const usersResult = await query(
    `SELECT user_id, name, email, role, status, registration_no, batch_year, created_at, updated_at
     FROM users ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { users: usersResult.rows, total, page, limit };
};

export const getUserById = async (userId) => {
  const result = await query(
    'SELECT user_id, name, email, role, status, registration_no, batch_year, created_at, updated_at FROM users WHERE user_id = $1',
    [userId]
  );

  const user = result.rows[0];
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  return user;
};

export const updateUserStatus = async (userId, status) => {
  const result = await query(
    `UPDATE users SET status = $1, updated_at = NOW()
     WHERE user_id = $2
     RETURNING user_id, name, email, role, status, registration_no, batch_year, updated_at`,
    [status, userId]
  );

  if (result.rows.length === 0) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  // TODO: emit an event to MS4 notification queue after status update (wire when MS4 is ready).
  return result.rows[0];
};

export const updateUserRole = async (userId, role) => {
  const result = await query(
    `UPDATE users SET role = $1, updated_at = NOW()
     WHERE user_id = $2
     RETURNING user_id, name, email, role, status, registration_no, batch_year, updated_at`,
    [role, userId]
  );

  if (result.rows.length === 0) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  return result.rows[0];
};
