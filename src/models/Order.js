const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true
    },
    restaurantName: { type: String, required: true },
    status: { type: String, enum: ['placed', 'completed'], default: 'placed' },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    orderedAtEpoch: { type: Number, required: true },
    completedAtEpoch: { type: Number, default: null },
    rating: { type: Number, default: null, min: 1, max: 5 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
