const express = require('express');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const {
  requestOtpSchema,
  verifyOtpSchema,
  updateFcmTokenSchema
} = require('../validators/auth.validator');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post('/request-otp', validate(requestOtpSchema), asyncHandler(authController.requestOtp));
router.post('/verify-otp', validate(verifyOtpSchema), asyncHandler(authController.verifyOtp));
router.post('/refresh', asyncHandler(authController.refresh));
router.post('/logout', asyncHandler(authController.logout));
router.get('/me', auth, asyncHandler(authController.me));
router.post(
  '/fcm-token',
  auth,
  validate(updateFcmTokenSchema),
  asyncHandler(authController.updateFcmToken)
);

module.exports = router;
