const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const { successResponse } = require('../utils/apiResponse');
const { createAndSendBulkNotifications } = require('../utils/notification');

const HARD_CODED_ADMIN_PHONE = '9585648678';

async function getMyRestaurantOrThrow(user) {
  if (!user.restaurantId && user.phone === HARD_CODED_ADMIN_PHONE) {
    const fallbackRestaurant = await Restaurant.findOne({ isActive: true }).sort({ createdAt: 1 });
    if (!fallbackRestaurant) {
      const error = new Error('No active restaurant found');
      error.statusCode = 404;
      throw error;
    }

    return fallbackRestaurant;
  }

  if (!user.restaurantId) {
    const error = new Error('Restaurant is not linked to this account');
    error.statusCode = 400;
    throw error;
  }

  const restaurant = await Restaurant.findById(user.restaurantId);
  if (!restaurant) {
    const error = new Error('Restaurant not found');
    error.statusCode = 404;
    throw error;
  }

  if (!restaurant.isActive) {
    const error = new Error('Restaurant is inactive');
    error.statusCode = 403;
    throw error;
  }

  return restaurant;
}

function startOfTodayEpoch() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return start.getTime();
}

async function getDashboard(req, res) {
  const restaurant = await getMyRestaurantOrThrow(req.user);
  const menu = await MenuItem.find({ restaurantId: restaurant._id, isActive: true }).sort({ createdAt: -1 });

  const orders = await Order.find({ restaurantId: restaurant._id }).lean();
  const todayStart = startOfTodayEpoch();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const completedOrders = orders.filter((o) => o.status === 'completed');
  const completedToday = completedOrders.filter((o) => (o.completedAtEpoch || 0) >= todayStart);
  const weeklyCompleted = completedOrders.filter((o) => (o.completedAtEpoch || 0) >= sevenDaysAgo);
  const monthlyCompleted = completedOrders.filter((o) => (o.completedAtEpoch || 0) >= thirtyDaysAgo);

  const todayEarnings = completedToday.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const weeklyRevenue = weeklyCompleted.reduce((sum, o) => sum + o.totalAmount, 0);
  const monthlyRevenue = monthlyCompleted.reduce((sum, o) => sum + o.totalAmount, 0);
  const averageOrderValue = completedOrders.length
    ? Number((totalRevenue / completedOrders.length).toFixed(2))
    : 0;
  const ordersToday = orders.filter((o) => o.orderedAtEpoch >= todayStart).length;

  const pendingAmount = orders
    .filter((o) => o.status === 'placed')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const completedAmount = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const channelsTotal = pendingAmount + completedAmount;

  const revenueChannels = [
    {
      label: 'Pending',
      amount: pendingAmount,
      percentage: channelsTotal ? Number(((pendingAmount / channelsTotal) * 100).toFixed(2)) : 0
    },
    {
      label: 'Completed',
      amount: completedAmount,
      percentage: channelsTotal ? Number(((completedAmount / channelsTotal) * 100).toFixed(2)) : 0
    }
  ];

  return successResponse(res, 'Restaurant dashboard fetched successfully', {
    profile: {
      storeName: restaurant.storeName,
      ownerName: restaurant.ownerName,
      phone: restaurant.phone,
      email: restaurant.email,
      address: restaurant.address,
      cuisine: restaurant.cuisine,
      openTimeEpoch: restaurant.openTimeEpoch,
      closeTimeEpoch: restaurant.closeTimeEpoch
    },
    metrics: {
      todayEarnings,
      totalRevenue,
      weeklyRevenue,
      monthlyRevenue,
      averageOrderValue,
      ordersToday,
      orderStatus: {
        pending: orders.filter((o) => o.status === 'placed').length,
        completed: completedOrders.length,
        cancelled: 0
      },
      revenueChannels
    },
    menu
  });
}

async function getProfile(req, res) {
  const restaurant = await getMyRestaurantOrThrow(req.user);

  return successResponse(res, 'Restaurant profile fetched successfully', {
    storeName: restaurant.storeName,
    ownerName: restaurant.ownerName,
    phone: restaurant.phone,
    email: restaurant.email,
    address: restaurant.address,
    cuisine: restaurant.cuisine,
    openTimeEpoch: restaurant.openTimeEpoch,
    closeTimeEpoch: restaurant.closeTimeEpoch,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
    imageUrl: restaurant.imageUrl
  });
}

async function updateProfile(req, res) {
  const restaurant = await getMyRestaurantOrThrow(req.user);

  Object.assign(restaurant, req.body);
  await restaurant.save();

  return successResponse(res, 'Restaurant profile updated successfully', restaurant);
}

async function listMenu(req, res) {
  const restaurant = await getMyRestaurantOrThrow(req.user);

  const menu = await MenuItem.find({ restaurantId: restaurant._id }).sort({ createdAt: -1 });
  return successResponse(res, 'Restaurant menu fetched successfully', menu);
}

async function findMenuByName(req, res) {
  const restaurant = await getMyRestaurantOrThrow(req.user);
  const name = (req.query.name || '').trim();

  const regex = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const items = await MenuItem.find({ restaurantId: restaurant._id, name: regex }).sort({ name: 1 });

  return successResponse(res, 'Menu item search completed', items);
}

async function upsertMenuItem(req, res) {
  const restaurant = await getMyRestaurantOrThrow(req.user);
  const { name, ...payload } = req.body;

  const nameNormalized = name.trim().toLowerCase();
  let item = await MenuItem.findOne({ restaurantId: restaurant._id, nameNormalized });
  let wasExisting = true;

  if (!item) {
    wasExisting = false;
    item = await MenuItem.create({
      restaurantId: restaurant._id,
      name,
      ...payload
    });

    const userIds = await Order.distinct('userId', { restaurantId: restaurant._id });
    if (userIds.length) {
      await createAndSendBulkNotifications(
        userIds,
        'New menu item available',
        `${restaurant.storeName} added ${item.name} to the menu.`,
        {
          type: 'new_menu_item',
          restaurantId: restaurant._id.toString(),
          menuItemId: item._id.toString()
        }
      );
    }
  } else {
    item.name = name;
    Object.assign(item, payload);
    await item.save();
  }

  return successResponse(res, 'Menu upsert completed', { item, wasExisting });
}

async function listRestaurantOrders(req, res) {
  const restaurant = await getMyRestaurantOrThrow(req.user);
  const filter = { restaurantId: restaurant._id };

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 });
  return successResponse(res, 'Restaurant orders fetched successfully', orders);
}

async function completeRestaurantOrder(req, res) {
  const restaurant = await getMyRestaurantOrThrow(req.user);
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid order id');
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findOne({ _id: id, restaurantId: restaurant._id });
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

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  listMenu,
  findMenuByName,
  upsertMenuItem,
  listRestaurantOrders,
  completeRestaurantOrder
};
