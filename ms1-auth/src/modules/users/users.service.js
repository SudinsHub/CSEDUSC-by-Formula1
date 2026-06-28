import { query } from '../../db.js';

const VALID_STATUSES = ['PENDING', 'ACTIVE', 'REJECTED', 'REVOKED'];
const VALID_ROLES = ['GeneralStudent', 'ECMember', 'Administrator'];

export const listUsers = async ({ status, role, page, limit, search }) => {
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

  if (search && typeof search === 'string' && search.trim() !== '') {
    params.push(`%${search.trim()}%`);
    conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length} OR registration_no ILIKE $${params.length})`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*) FROM users ${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const usersResult = await query(
    `SELECT user_id AS "userId", name, email, role, status, registration_no AS "registrationNo", batch_year AS "batchYear", contact_no AS "contactNo", profile_picture AS "profilePicture", created_at AS "createdAt", updated_at AS "updatedAt"
     FROM users ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { users: usersResult.rows, total, page, limit };
};

export const getUserById = async (userId) => {
  const result = await query(
    'SELECT user_id AS "userId", name, email, role, status, registration_no AS "registrationNo", batch_year AS "batchYear", contact_no AS "contactNo", profile_picture AS "profilePicture", created_at AS "createdAt", updated_at AS "updatedAt" FROM users WHERE user_id = $1',
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
     RETURNING user_id AS "userId", name, email, role, status, registration_no AS "registrationNo", batch_year AS "batchYear", updated_at AS "updatedAt"`,
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

export const activatePendingUsers = async () => {
  const result = await query(
    `UPDATE users SET status = 'ACTIVE', updated_at = NOW()
     WHERE status = 'PENDING'
     RETURNING user_id AS "userId", name, email, role, status, registration_no AS "registrationNo", batch_year AS "batchYear", updated_at AS "updatedAt"`
  );
  return { updatedCount: result.rowCount, users: result.rows };
};

export const updateUserRole = async (userId, role) => {
  const result = await query(
    `UPDATE users SET role = $1, updated_at = NOW()
     WHERE user_id = $2
     RETURNING user_id AS "userId", name, email, role, status, registration_no AS "registrationNo", batch_year AS "batchYear", updated_at AS "updatedAt"`,
    [role, userId]
  );

  if (result.rows.length === 0) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  return result.rows[0];
};

export const updateProfile = async (userId, { email, contactNo, profilePicture }) => {
  const updates = [];
  const params = [];
  
  if (email !== undefined) {
    // Check if email already exists for another user
    const existing = await query('SELECT user_id FROM users WHERE email = $1 AND user_id <> $2', [email, userId]);
    if (existing.rows.length > 0) {
      const err = new Error('Email already registered by another user');
      err.status = 409;
      throw err;
    }
    params.push(email);
    updates.push(`email = $${params.length}`);
  }
  
  if (contactNo !== undefined) {
    params.push(contactNo);
    updates.push(`contact_no = $${params.length}`);
  }
  
  if (profilePicture !== undefined) {
    params.push(profilePicture);
    updates.push(`profile_picture = $${params.length}`);
  }
  
  if (updates.length === 0) {
    return await getUserById(userId);
  }
  
  params.push(userId);
  const sql = `
    UPDATE users
    SET ${updates.join(', ')}, updated_at = NOW()
    WHERE user_id = $${params.length}
    RETURNING user_id AS "userId", name, email, role, status, registration_no AS "registrationNo", batch_year AS "batchYear", contact_no AS "contactNo", profile_picture AS "profilePicture", updated_at AS "updatedAt"
  `;
  
  const result = await query(sql, params);
  
  if (result.rows.length === 0) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  
  if (profilePicture) {
    // Cross-schema update to set uploaded_by to this user's user_id in content.media
    await query(
      'UPDATE content.media SET uploaded_by = $1 WHERE file_path = $2',
      [userId, profilePicture]
    );
  }
  
  return result.rows[0];
};

export const deleteUser = async (userId) => {
  // Clean up user's registrations from content.event_registrations
  await query('DELETE FROM content.event_registrations WHERE user_id = $1', [userId]);

  const result = await query('DELETE FROM users WHERE user_id = $1 RETURNING user_id', [userId]);
  if (result.rows.length === 0) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return { message: 'Account deleted successfully' };
};
