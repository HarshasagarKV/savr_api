const mongoose = require('mongoose');

const otpSessionSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    role: { type: String, enum: ['user', 'restaurant'], required: true },
    requestId: { type: String, required: true, unique: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    verifiedAt: { type: Date, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

otpSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OtpSession', otpSessionSchema);
