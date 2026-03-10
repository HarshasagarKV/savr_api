const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true },
    nameNormalized: { type: String, required: true },
    description: { type: String, default: '' },
    actualPrice: { type: Number, required: true },
    discountedPrice: { type: Number, required: true },
    imageUrl: { type: String, default: null },
    availableFrom: { type: Number, required: true },
    quantity: { type: Number, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

menuItemSchema.pre('validate', function normalizeName(next) {
  this.nameNormalized = (this.name || '').trim().toLowerCase();
  next();
});

menuItemSchema.index({ restaurantId: 1, nameNormalized: 1 }, { unique: true });
menuItemSchema.index({ name: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
