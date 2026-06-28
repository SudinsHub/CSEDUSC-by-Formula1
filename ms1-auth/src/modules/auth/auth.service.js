import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../../db.js';
import { config } from '../../config.js';
import { emitNotification } from '../../queues/index.js';

const BCRYPT_ROUNDS = 12;

// ── Helpers ───────────────────────────────────────────────────────────────────

const issueTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpires }
  );
  const refreshToken = jwt.sign(
    { userId },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpires }
  );
  return { accessToken, refreshToken };
};

// ── Service methods ───────────────────────────────────────────────────────────

export const register = async ({ name, email, password, registrationNo, batchYear, contactNo = null, profilePicture = null }) => {
  const existing = await query('SELECT user_id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const result = await query(
    `INSERT INTO users (name, email, password_hash, registration_no, batch_year, contact_no, profile_picture)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING user_id`,
    [name, email, password_hash, registrationNo, batchYear, contactNo, profilePicture]
  );

  const userId = result.rows[0].user_id;

  if (profilePicture) {
    // Cross-schema update to set uploaded_by to this user's user_id in content.media
    await query(
      'UPDATE content.media SET uploaded_by = $1 WHERE file_path = $2',
      [userId, profilePicture]
    );
  }
};

export const login = async ({ email, password }) => {
  const result = await query(
    'SELECT user_id, name, email, password_hash, role, status, registration_no, batch_year, contact_no, profile_picture FROM users WHERE email = $1',
    [email]
  );

  const user = result.rows[0];

  // Intentionally vague — do not reveal whether the email exists
  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  if (user.status !== 'ACTIVE') {
    const err = new Error('Account is not active');
    err.status = 403;
    throw err;
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const { accessToken, refreshToken } = issueTokens(user.user_id, user.role);

  return {
    accessToken,
    refreshToken,
    user: {
      userId: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      registrationNo: user.registration_no,
      batchYear: user.batch_year,
      contactNo: user.contact_no,
      profilePicture: user.profile_picture,
    },
  };
};

export const getMe = async (userId) => {
  const result = await query(
    'SELECT user_id, name, email, role, status, registration_no, batch_year, contact_no, profile_picture, created_at FROM users WHERE user_id = $1',
    [userId]
  );

  const user = result.rows[0];
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  return {
    userId: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    registrationNo: user.registration_no,
    batchYear: user.batch_year,
    contactNo: user.contact_no,
    profilePicture: user.profile_picture,
    createdAt: user.created_at,
  };
};

export const forgotPassword = async (email) => {
  const result = await query(
    "SELECT user_id, name FROM users WHERE email = $1 AND status = 'ACTIVE'",
    [email]
  );

  const user = result.rows[0];
  if (!user) return; // Respond the same regardless — caller always sends 200

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
    [user.user_id, tokenHash]
  );

  const resetLink = `${config.frontendUrl}/reset-password?token=${rawToken}`;

  await emitNotification('auth.forgot_password', {
    email,
    name: user.name,
    resetLink,
  });
};

export const resetPassword = async ({ token, newPassword }) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const result = await query(
    `SELECT token_id, user_id FROM password_reset_tokens
     WHERE token_hash = $1 AND used = FALSE AND expires_at > NOW()`,
    [tokenHash]
  );

  const row = result.rows[0];
  if (!row) {
    const err = new Error('Invalid or expired reset token');
    err.status = 400;
    throw err;
  }

  const password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2',
    [password_hash, row.user_id]
  );

  await query(
    'UPDATE password_reset_tokens SET used = TRUE WHERE token_id = $1',
    [row.token_id]
  );
};

export const refresh = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.secret);
    const result = await query(
      'SELECT user_id, role, status FROM users WHERE user_id = $1',
      [decoded.userId]
    );

    const user = result.rows[0];
    if (!user || user.status !== 'ACTIVE') {
      const err = new Error('Invalid or inactive user');
      err.status = 401;
      throw err;
    }

    return issueTokens(user.user_id, user.role);
  } catch (jwtErr) {
    if (jwtErr.status) throw jwtErr;
    const err = new Error('Invalid or expired refresh token');
    err.status = 401;
    throw err;
  }
};

