const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    storeName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    address: { type: String, required: true },
    cuisine: { type: String, required: true },
    openTimeEpoch: { type: Number, required: true },
    closeTimeEpoch: { type: Number, required: true },
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    imageUrl: { type: String, default: null },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Restaurant', restaurantSchema);
