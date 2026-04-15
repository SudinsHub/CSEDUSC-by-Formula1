import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { query } from '../../db.js';
import { config } from '../../config.js';

const BCRYPT_ROUNDS = 12;

// ── Mailer ────────────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false, // STARTTLS
  auth: { user: config.smtp.user, pass: config.smtp.pass },
});

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

export const register = async ({ name, email, password, batch_year }) => {
  const existing = await query('SELECT user_id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await query(
    `INSERT INTO users (name, email, password_hash, batch_year)
     VALUES ($1, $2, $3, $4)`,
    [name, email, password_hash, batch_year]
  );
};

export const login = async ({ email, password }) => {
  const result = await query(
    'SELECT user_id, name, email, password_hash, role, status, batch_year FROM users WHERE email = $1',
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
      batch_year: user.batch_year,
    },
  };
};

export const getMe = async (userId) => {
  const result = await query(
    'SELECT user_id, name, email, role, status, batch_year, created_at FROM users WHERE user_id = $1',
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
    batch_year: user.batch_year,
    created_at: user.created_at,
  };
};

export const forgotPassword = async (email) => {
  const result = await query(
    "SELECT user_id FROM users WHERE email = $1 AND status = 'ACTIVE'",
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

  await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'Password Reset Request — CSEDU Club',
    text: `You requested a password reset. Click the link below within 30 minutes:\n\n${resetLink}\n\nIf you did not request this, ignore this email.`,
    html: `<p>You requested a password reset. Click the link below within 30 minutes:</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, ignore this email.</p>`,
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
