/**
 * --------------------------------------------------------------------------
 * JWT Authentication Middleware
 * --------------------------------------------------------------------------
 * Purpose:
 * - Validates JWT access tokens
 * - Extracts user information from token payload
 * - Attaches decoded user data to req.user
 *
 * Usage:
 * router.get("/protected", verifyToken, controller);
 * --------------------------------------------------------------------------
 */

const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    // Read Authorization header
    const authHeader = req.headers.authorization;

    // Check if token exists
    if (!authHeader) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    // Expected format:
    // Authorization: Bearer <token>
    const token = authHeader.split(" ")[1];

    // Verify token integrity and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Store decoded user information
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};

module.exports = verifyToken;
