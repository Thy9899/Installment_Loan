/**
 * --------------------------------------------------------------------------
 * Request Validation Middleware
 * --------------------------------------------------------------------------
 * Purpose:
 * - Validates incoming request payloads
 * - Uses Joi schemas
 * - Prevents invalid data from reaching controllers
 *
 * Example:
 * router.post(
 *   "/customers",
 *   validate(customerSchema),
 *   customerController.create
 * );
 * --------------------------------------------------------------------------
 */

module.exports = (schema) => {
  return (req, res, next) => {
    // Validate request body against Joi schema
    const { error } = schema.validate(req.body);

    // Return validation error if request is invalid
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    next();
  };
};
