const { ApiError } = require('../utils/respond');

/**
 * Validate req[source] against a Zod schema.
 * Replaces req[source] with the parsed object on success.
 */
function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return next(new ApiError('Validation failed', 400, details));
    }
    req[source] = result.data;
    next();
  };
}

module.exports = { validate };
