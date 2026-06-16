/**
 * --------------------------------------------------------------------------
 * Role-Based Access Control (RBAC) Middleware
 * --------------------------------------------------------------------------
 * Purpose:
 * - Restricts access based on user roles
 * - Works together with JWT authentication
 *
 * Example:
 * authorizeRoles("Admin")
 * authorizeRoles("Admin", "Manager")
 *
 * Usage:
 * router.post(
 *   "/create",
 *   verifyToken,
 *   authorizeRoles("Admin"),
 *   controller
 * );
 * --------------------------------------------------------------------------
 */

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Verify user data exists
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No role found in token",
      });
    }

    // Check whether user role is allowed
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You do not have permission",
      });
    }

    next();
  };
};

module.exports = authorizeRoles;
