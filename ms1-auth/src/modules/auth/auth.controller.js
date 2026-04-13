import * as authService from './auth.service.js';

export const register = async (req, res) => {
  try {
    await authService.register(req.body);
    res.status(201).json({ message: 'Registration submitted. Awaiting admin approval.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[auth/register]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = async (_req, res) => {
  // TODO: invalidate the refresh token once a Redis-backed token blacklist is integrated (MS-future).
  res.status(200).json({ message: 'Logged out successfully' });
};

export const me = async (req, res) => {
  try {
    const user = await authService.getMe(req.userId);
    res.status(200).json(user);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[auth/me]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    await authService.forgotPassword(req.body.email);
  } catch (err) {
    // Log but swallow — caller always receives 200 to prevent enumeration
    console.error('[auth/forgot-password]', err);
  }
  res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
};

export const resetPassword = async (req, res) => {
  try {
    await authService.resetPassword(req.body);
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[auth/reset-password]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
