const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const OtpSession = require('../models/OtpSession');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { successResponse } = require('../utils/apiResponse');
const { generateOtp, hashOtp, compareOtp, getOtpExpiryDate } = require('../utils/otp');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiryDate
} = require('../utils/jwt');
const env = require('../config/env');

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax',
  path: '/api/v1/auth'
};

async function requestOtp(req, res) {
  const { phone, role } = req.body;

  if (role === 'restaurant') {
    const restaurantUser = await User.findOne({ phone, role: 'restaurant' });
    if (!restaurantUser) {
      const error = new Error('Restaurant account does not exist for this phone');
      error.statusCode = 404;
      throw error;
    }
  }

  await OtpSession.deleteMany({ phone, role, verifiedAt: null });

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const requestId = uuidv4();
  const expiresAt = getOtpExpiryDate();

  await OtpSession.create({
    phone,
    role,
    requestId,
    otpHash,
    expiresAt
  });

  const data = {
    requestId,
    otpExpiresAtEpoch: expiresAt.getTime()
  };

  if (env.nodeEnv === 'development') {
    data.devOtp = otp;
  }

  return successResponse(res, 'OTP requested successfully', data);
}

async function verifyOtp(req, res) {
  const { phone, role, requestId, otp, fcmToken } = req.body;

  const otpSession = await OtpSession.findOne({ phone, role, requestId });
  if (!otpSession) {
    const error = new Error('Invalid OTP request');
    error.statusCode = 400;
    throw error;
  }

  if (otpSession.verifiedAt) {
    const error = new Error('OTP already verified');
    error.statusCode = 400;
    throw error;
  }

  if (otpSession.attempts >= 5) {
    const error = new Error('Too many OTP attempts');
    error.statusCode = 429;
    throw error;
  }

  if (otpSession.expiresAt.getTime() < Date.now()) {
    const error = new Error('OTP expired');
    error.statusCode = 400;
    throw error;
  }

  const otpMatches = await compareOtp(otp, otpSession.otpHash);
  if (!otpMatches) {
    otpSession.attempts += 1;
    await otpSession.save();
    const error = new Error('Invalid OTP');
    error.statusCode = 400;
    throw error;
  }

  otpSession.verifiedAt = new Date();
  await otpSession.save();

  let user = await User.findOne({ phone, role });

  if (!user && role === 'user') {
    user = await User.create({
      phone,
      role: 'user'
    });
  }

  if (!user) {
    const error = new Error('Account not found for this role');
    error.statusCode = 404;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Account is inactive');
    error.statusCode = 403;
    throw error;
  }

  if (fcmToken) {
    user.fcmToken = fcmToken;
    await user.save();
  }

  const accessPayload = { userId: user._id.toString(), role: user.role, tokenType: 'access' };
  const refreshPayload = { userId: user._id.toString(), role: user.role, tokenType: 'refresh' };

  const token = signAccessToken(accessPayload);
  const refreshToken = signRefreshToken(refreshPayload);
  const refreshTokenHash = await bcrypt.hash(refreshToken, env.bcryptSaltRounds);

  await RefreshToken.create({
    userId: user._id,
    tokenHash: refreshTokenHash,
    expiresAt: getRefreshTokenExpiryDate()
  });

  res.cookie('refreshToken', refreshToken, refreshCookieOptions);

  return successResponse(res, 'OTP verified successfully', {
    token,
    role: user.role,
    phone: user.phone,
    user: {
      id: user._id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      restaurantId: user.restaurantId
    }
  });
}

async function refresh(req, res) {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    const error = new Error('Refresh token missing');
    error.statusCode = 401;
    throw error;
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(incomingRefreshToken);
  } catch (e) {
    const error = new Error('Invalid refresh token');
    error.statusCode = 401;
    throw error;
  }

  if (decoded.tokenType !== 'refresh') {
    const error = new Error('Invalid refresh token type');
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) {
    const error = new Error('User is not active');
    error.statusCode = 401;
    throw error;
  }

  const activeTokens = await RefreshToken.find({
    userId: user._id,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  });

  let matchedToken = null;
  for (const tokenDoc of activeTokens) {
    const matches = await bcrypt.compare(incomingRefreshToken, tokenDoc.tokenHash);
    if (matches) {
      matchedToken = tokenDoc;
      break;
    }
  }

  if (!matchedToken) {
    const error = new Error('Refresh token revoked or invalid');
    error.statusCode = 401;
    throw error;
  }

  matchedToken.revokedAt = new Date();
  await matchedToken.save();

  const newAccessToken = signAccessToken({
    userId: user._id.toString(),
    role: user.role,
    tokenType: 'access'
  });

  const newRefreshToken = signRefreshToken({
    userId: user._id.toString(),
    role: user.role,
    tokenType: 'refresh'
  });

  await RefreshToken.create({
    userId: user._id,
    tokenHash: await bcrypt.hash(newRefreshToken, env.bcryptSaltRounds),
    expiresAt: getRefreshTokenExpiryDate()
  });

  res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);

  return successResponse(res, 'Token refreshed successfully', {
    token: newAccessToken
  });
}

async function logout(req, res) {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (incomingRefreshToken) {
    const tokenDocs = await RefreshToken.find({
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    });

    for (const tokenDoc of tokenDocs) {
      const matches = await bcrypt.compare(incomingRefreshToken, tokenDoc.tokenHash);
      if (matches) {
        tokenDoc.revokedAt = new Date();
        await tokenDoc.save();
        break;
      }
    }
  }

  res.clearCookie('refreshToken', refreshCookieOptions);

  return successResponse(res, 'Logged out successfully', {});
}

async function me(req, res) {
  return successResponse(res, 'Authenticated user fetched successfully', {
    id: req.user._id,
    role: req.user.role,
    phone: req.user.phone,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    restaurantId: req.user.restaurantId
  });
}

async function updateFcmToken(req, res) {
  const { fcmToken } = req.body;

  req.user.fcmToken = fcmToken || null;
  await req.user.save();

  return successResponse(res, 'FCM token updated successfully', {
    fcmToken: req.user.fcmToken
  });
}

module.exports = {
  requestOtp,
  verifyOtp,
  refresh,
  logout,
  me,
  updateFcmToken
};
