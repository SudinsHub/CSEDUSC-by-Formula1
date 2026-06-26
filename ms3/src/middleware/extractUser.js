/**
 * Optional user extraction middleware
 * Injects X-User-Id, X-User-Role, X-User-Email headers if present
 */
export const extractUser = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  const userEmail = req.headers['x-user-email'];

  if (userId) {
    req.userId = parseInt(userId, 10);
  }
  if (userRole) {
    req.userRole = userRole;
  }
  if (userEmail) {
    req.userEmail = userEmail;
  }

  next();
};
