const bcrypt = require('bcryptjs');
const env = require('../config/env');

function generateOtp() {
  if (env.nodeEnv === 'development') {
    return '123456';
  }

  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

async function hashOtp(otp) {
  return bcrypt.hash(otp, env.bcryptSaltRounds);
}

async function compareOtp(otp, otpHash) {
  return bcrypt.compare(otp, otpHash);
}

function getOtpExpiryDate() {
  return new Date(Date.now() + env.otpTtlMinutes * 60 * 1000);
}

module.exports = {
  generateOtp,
  hashOtp,
  compareOtp,
  getOtpExpiryDate
};
