const jwt = require('jsonwebtoken');
const ms = require('ms');
const env = require('../config/env');

function signAccessToken(payload) {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpires
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpires
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

function getRefreshTokenExpiryDate() {
  const durationMs = ms(env.jwtRefreshExpires);
  return new Date(Date.now() + durationMs);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getRefreshTokenExpiryDate
};
