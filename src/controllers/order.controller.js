const mongoose = require('mongoose');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const { successResponse } = require('../utils/apiResponse');
const { createAndSendNotification } = require('../utils/notification');

async function createOrder(req, res) {
  const { restaurantId, items } = req.body;

  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    const error = new Error('Invalid restaurantId');
    error.statusCode = 400;
    throw error;
  }

  const restaurant = await Restaurant.findOne({ _id: restaurantId, isActive: true });
  if (!restaurant) {
    const error = new Error('Restaurant not found or inactive');
    error.statusCode = 404;
    throw error;
  }

  const itemIds = items.map((item) => item.foodId);
  const menuItems = await MenuItem.find({
    _id: { $in: itemIds },
    restaurantId,
    isActive: true
  });

  if (menuItems.length !== itemIds.length) {
    const error = new Error('One or more menu items are invalid for this restaurant');
    error.statusCode = 400;
    throw error;
  }

  const menuById = new Map(menuItems.map((item) => [item._id.toString(), item]));
  const orderItems = [];
  let totalAmount = 0;

  for (const reqItem of items) {
    const menuItem = menuById.get(reqItem.foodId);
    if (!menuItem) {
      const error = new Error(`Menu item not found: ${reqItem.foodId}`);
      error.statusCode = 400;
      throw error;
    }

    if (menuItem.quantity < reqItem.quantity) {
      const error = new Error(`Insufficient quantity for ${menuItem.name}`);
      error.statusCode = 400;
      throw error;
    }

    const unitPrice = menuItem.discountedPrice;
    const lineTotal = unitPrice * reqItem.quantity;
    totalAmount += lineTotal;

    orderItems.push({
      foodId: menuItem._id,
      name: menuItem.name,
      unitPrice,
      quantity: reqItem.quantity
    });

    menuItem.quantity -= reqItem.quantity;
    await menuItem.save();
  }

  const order = await Order.create({
    userId: req.user._id,
    restaurantId: restaurant._id,
    restaurantName: restaurant.storeName,
    items: orderItems,
    totalAmount,
    orderedAtEpoch: Date.now(),
    status: 'placed'
  });

  await createAndSendNotification(
    req.user._id,
    'Order placed',
    `Your order at ${restaurant.storeName} has been placed.`,
    { type: 'order_placed', orderId: order._id.toString() }
  );

  return successResponse(res, 'Order placed successfully', order, 201);
}

async function listMyOrders(req, res) {
  const filter = { userId: req.user._id };
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 });
  return successResponse(res, 'Orders fetched successfully', orders);
}

async function getMyOrderById(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid order id');
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findOne({ _id: id, userId: req.user._id });
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  return successResponse(res, 'Order fetched successfully', order);
}

async function completeMyOrder(req, res) {
  const { id } = req.params;

  const order = await Order.findOne({ _id: id, userId: req.user._id });
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  if (order.status === 'completed') {
    return successResponse(res, 'Order already completed', order);
  }

  order.status = 'completed';
  order.completedAtEpoch = Date.now();
  await order.save();

  return successResponse(res, 'Order marked as completed', order);
}

async function rateMyOrder(req, res) {
  const { id } = req.params;
  const { rating } = req.body;

  const order = await Order.findOne({ _id: id, userId: req.user._id });
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  if (order.status !== 'completed') {
    const error = new Error('Only completed orders can be rated');
    error.statusCode = 400;
    throw error;
  }

  order.rating = rating;
  await order.save();

  const restaurantStats = await Order.aggregate([
    { $match: { restaurantId: order.restaurantId, rating: { $ne: null } } },
    {
      $group: {
        _id: '$restaurantId',
        averageRating: { $avg: '$rating' },
        ratingCount: { $sum: 1 }
      }
    }
  ]);

  if (restaurantStats[0]) {
    await Restaurant.findByIdAndUpdate(order.restaurantId, {
      averageRating: Number(restaurantStats[0].averageRating.toFixed(2)),
      ratingCount: restaurantStats[0].ratingCount
    });
  }

  return successResponse(res, 'Order rated successfully', order);
}

module.exports = {
  createOrder,
  listMyOrders,
  getMyOrderById,
  completeMyOrder,
  rateMyOrder
};
