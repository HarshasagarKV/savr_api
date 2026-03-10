function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      return next(error);
    }

    if (!allowedRoles.includes(req.user.role)) {
      const error = new Error('Forbidden: insufficient role');
      error.statusCode = 403;
      return next(error);
    }

    return next();
  };
}

module.exports = authorizeRoles;
