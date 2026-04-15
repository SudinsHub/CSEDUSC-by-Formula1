/**
 * Role-based access control middleware
 * Expects X-User-Id, X-User-Role, X-User-Email headers injected by API Gateway
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];
    const userEmail = req.headers['x-user-email'];

    if (!userId || !userRole) {
      return res.status(401).json({ error: 'Unauthorized: Missing user headers' });
    }

    // Attach user info to request object
    req.userId = parseInt(userId, 10);
    req.userRole = userRole;
    req.userEmail = userEmail;

    // Check if user's role is in the allowed list
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};
