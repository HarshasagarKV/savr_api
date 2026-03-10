const { errorResponse } = require('../utils/apiResponse');

function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const errors = err.errors || [];

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error(err);
  }

  return errorResponse(res, message, errors, statusCode);
}

module.exports = {
  notFoundHandler,
  errorHandler
};
