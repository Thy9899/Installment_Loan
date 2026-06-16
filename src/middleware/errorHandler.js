/**
 * --------------------------------------------------------------------------
 * Global Error Handling Middleware
 * --------------------------------------------------------------------------
 * Purpose:
 * - Catches unhandled application errors
 * - Logs errors for debugging
 * - Returns standardized API error responses
 *
 * Must be registered after all routes.
 * --------------------------------------------------------------------------
 */

module.exports = (err, req, res, next) => {
  // Log error details for troubleshooting
  console.error(err);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};
