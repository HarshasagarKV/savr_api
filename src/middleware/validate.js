const { ZodError } = require('zod');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const err = new Error('Validation failed');
        err.statusCode = 400;
        err.errors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message
        }));
        return next(err);
      }
      return next(error);
    }
  };
}

module.exports = validate;
