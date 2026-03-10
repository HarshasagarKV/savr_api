const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, index: true, trim: true },
    role: { type: String, enum: ['user', 'restaurant', 'admin'], required: true },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    fcmToken: { type: String, default: null },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
