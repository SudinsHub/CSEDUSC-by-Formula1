import * as usersService from './users.service.js';

export const listUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const { status, role } = req.query;

    const result = await usersService.listUsers({ status, role, page, limit });
    res.status(200).json(result);
  } catch (err) {
    console.error('[users/list]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await usersService.getUserById(req.params.userId);
    res.status(200).json(user);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[users/get]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const user = await usersService.updateUserStatus(req.params.userId, req.body.status);
    res.status(200).json(user);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[users/updateStatus]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateRole = async (req, res) => {
  try {
    const user = await usersService.updateUserRole(req.params.userId, req.body.role);
    res.status(200).json(user);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[users/updateRole]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
