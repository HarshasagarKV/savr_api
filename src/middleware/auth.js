const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const { verifyAccessToken } = require('../utils/jwt');

async function auth(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

    if (!token) {
      const error = new Error('Unauthorized: missing access token');
      error.statusCode = 401;
      throw error;
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.userId);

    if (!user) {
      const error = new Error('Unauthorized: user not found');
      error.statusCode = 401;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Account is inactive');
      error.statusCode = 403;
      throw error;
    }

    if (user.role === 'restaurant' && user.restaurantId) {
      const restaurant = await Restaurant.findById(user.restaurantId);
      if (!restaurant || !restaurant.isActive) {
        const error = new Error('Restaurant account is inactive');
        error.statusCode = 403;
        throw error;
      }
    }

    req.user = user;
    next();
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
      err.message = 'Unauthorized: invalid token';
    }
    next(err);
  }
}

module.exports = auth;
