const mongoose = require('mongoose');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const { successResponse } = require('../utils/apiResponse');

function getPagination(query) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

async function overview(req, res) {
  const [users, restaurants, activeOrders, completedOrdersAgg] = await Promise.all([
    User.countDocuments(),
    Restaurant.countDocuments(),
    Order.countDocuments({ status: 'placed' }),
    Order.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ])
  ]);

  const completedOrders = completedOrdersAgg[0]?.count || 0;
  const totalRevenue = completedOrdersAgg[0]?.totalRevenue || 0;

  return successResponse(res, 'Admin overview fetched successfully', {
    users,
    restaurants,
    activeOrders,
    completedOrders,
    totalRevenue
  });
}

async function listUsers(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const { role, search } = req.query;

  const filter = {};
  if (role) filter.role = role;

  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ phone: regex }, { firstName: regex }, { lastName: regex }];
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);

  return successResponse(res, 'Users fetched successfully', {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
}

async function updateUserStatus(req, res) {
  const { id } = req.params;
  const { isActive } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid user id');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByIdAndUpdate(id, { isActive }, { new: true });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return successResponse(res, 'User status updated successfully', user);
}

async function listRestaurants(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const { search } = req.query;

  const filter = {};
  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ storeName: regex }, { ownerName: regex }, { cuisine: regex }, { phone: regex }];
  }

  const [items, total] = await Promise.all([
    Restaurant.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Restaurant.countDocuments(filter)
  ]);

  return successResponse(res, 'Restaurants fetched successfully', {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
}

async function createRestaurant(req, res) {
  const payload = req.body;
  const loginPhone = payload.loginPhone || payload.phone;

  const existingLoginUser = await User.findOne({ phone: loginPhone });
  if (existingLoginUser && existingLoginUser.role !== 'restaurant') {
    const error = new Error('loginPhone is already used by a non-restaurant account');
    error.statusCode = 409;
    throw error;
  }

  if (existingLoginUser?.restaurantId) {
    const error = new Error('Restaurant login user is already linked to a restaurant');
    error.statusCode = 409;
    throw error;
  }

  let restaurant;
  try {
    restaurant = await Restaurant.create({
      storeName: payload.storeName,
      ownerName: payload.ownerName,
      phone: payload.phone,
      email: payload.email,
      address: payload.address,
      cuisine: payload.cuisine,
      openTimeEpoch: payload.openTimeEpoch,
      closeTimeEpoch: payload.closeTimeEpoch,
      latitude: payload.latitude,
      longitude: payload.longitude,
      imageUrl: payload.imageUrl ?? null
    });

    let restaurantUser = existingLoginUser;
    if (!restaurantUser) {
      restaurantUser = await User.create({
        phone: loginPhone,
        role: 'restaurant',
        firstName: payload.ownerName,
        restaurantId: restaurant._id,
        isActive: true
      });
    } else {
      restaurantUser.restaurantId = restaurant._id;
      restaurantUser.isActive = true;
      await restaurantUser.save();
    }

    return successResponse(
      res,
      'Restaurant created successfully',
      {
        restaurant,
        restaurantUser: {
          id: restaurantUser._id,
          phone: restaurantUser.phone,
          role: restaurantUser.role,
          restaurantId: restaurantUser.restaurantId
        }
      },
      201
    );
  } catch (error) {
    if (restaurant?._id) {
      await Restaurant.deleteOne({ _id: restaurant._id });
    }
    throw error;
  }
}

async function updateRestaurant(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid restaurant id');
    error.statusCode = 400;
    throw error;
  }

  const restaurant = await Restaurant.findByIdAndUpdate(id, req.body, { new: true });
  if (!restaurant) {
    const error = new Error('Restaurant not found');
    error.statusCode = 404;
    throw error;
  }

  return successResponse(res, 'Restaurant updated successfully', restaurant);
}

async function deleteRestaurant(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid restaurant id');
    error.statusCode = 400;
    throw error;
  }

  const restaurant = await Restaurant.findById(id);
  if (!restaurant) {
    const error = new Error('Restaurant not found');
    error.statusCode = 404;
    throw error;
  }

  await Promise.all([
    Restaurant.deleteOne({ _id: id }),
    MenuItem.deleteMany({ restaurantId: id }),
    User.updateMany(
      { restaurantId: id, role: 'restaurant' },
      { $set: { isActive: false, restaurantId: null } }
    )
  ]);

  return successResponse(res, 'Restaurant deleted successfully', { id });
}

async function updateRestaurantStatus(req, res) {
  const { id } = req.params;
  const { isActive } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid restaurant id');
    error.statusCode = 400;
    throw error;
  }

  const restaurant = await Restaurant.findByIdAndUpdate(id, { isActive }, { new: true });
  if (!restaurant) {
    const error = new Error('Restaurant not found');
    error.statusCode = 404;
    throw error;
  }

  if (!isActive) {
    await User.updateMany({ restaurantId: restaurant._id, role: 'restaurant' }, { isActive: false });
  }

  return successResponse(res, 'Restaurant status updated successfully', restaurant);
}

async function listOrders(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const { status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter)
  ]);

  return successResponse(res, 'Orders fetched successfully', {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
}

module.exports = {
  overview,
  listUsers,
  updateUserStatus,
  listRestaurants,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  updateRestaurantStatus,
  listOrders
};
