/**
 * Reads x-user-id and x-user-role headers forwarded by the API Gateway
 * (the gateway has already verified the JWT; MS1 trusts these headers completely).
 * Attaches req.userId and req.userRole, then enforces the allowed-roles list.
 *
 * @param {string[]} allowedRoles - roles permitted to access the route
 */
export const requireRole = (allowedRoles) => (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  if (!userId || !userRole) {
    return res.status(403).json({ error: 'Forbidden: missing identity headers' });
  }

  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ error: 'Forbidden: insufficient role' });
  }

  req.userId = userId;
  req.userRole = userRole;
  next();
};
