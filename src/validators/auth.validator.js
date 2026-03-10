const { z } = require('zod');

const phoneRegex = /^\+?[1-9]\d{7,14}$/;

const requestOtpSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Invalid phone format'),
  role: z.enum(['user', 'restaurant'])
});

const verifyOtpSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Invalid phone format'),
  role: z.enum(['user', 'restaurant']),
  requestId: z.string().min(6),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  fcmToken: z.string().min(10).max(4096).optional()
});

const updateFcmTokenSchema = z.object({
  fcmToken: z.string().min(10).max(4096).nullable()
});

module.exports = {
  requestOtpSchema,
  verifyOtpSchema,
  updateFcmTokenSchema
};
