const HARD_CODED_ADMIN_PHONE = '9585648678';

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      return next(error);
    }

    if (req.user.phone === HARD_CODED_ADMIN_PHONE) {
      return next();
    }

    // Admin can access both user and restaurant scoped APIs.
    if (
      req.user.role === 'admin' &&
      (allowedRoles.includes('user') || allowedRoles.includes('restaurant'))
    ) {
      return next();
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
