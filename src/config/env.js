const dotenv = require('dotenv');

dotenv.config();

const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/savr',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'change_me_access',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'change_me_refresh',
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES || 5),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY || '',
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',
  googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || ''
};

module.exports = env;
