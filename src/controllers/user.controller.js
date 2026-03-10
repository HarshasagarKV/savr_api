const mongoose = require('mongoose');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const { successResponse } = require('../utils/apiResponse');

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function getProfile(req, res) {
  return successResponse(res, 'Profile fetched successfully', {
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    phone: req.user.phone
  });
}

async function updateProfile(req, res) {
  const updates = {};
  if (req.body.firstName !== undefined) updates.firstName = req.body.firstName;
  if (req.body.lastName !== undefined) updates.lastName = req.body.lastName;

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });

  return successResponse(res, 'Profile updated successfully', {
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone
  });
}

async function getNearbyRestaurants(req, res) {
  const { latitude, longitude, maxDistanceKm } = req.query;

  const restaurants = await Restaurant.find({ isActive: true }).lean();
  const restaurantIds = restaurants.map((r) => r._id);
  const menuItems = await MenuItem.find({ restaurantId: { $in: restaurantIds }, isActive: true }).lean();

  const menuByRestaurant = new Map();
  for (const item of menuItems) {
    const key = item.restaurantId.toString();
    if (!menuByRestaurant.has(key)) {
      menuByRestaurant.set(key, []);
    }

    menuByRestaurant.get(key).push({
      id: item._id,
      name: item.name,
      actualPrice: item.actualPrice,
      discountedPrice: item.discountedPrice,
      description: item.description,
      imageUrl: item.imageUrl,
      availableFrom: item.availableFrom,
      quantity: item.quantity
    });
  }

  const response = restaurants
    .map((restaurant) => {
      const distanceKm = haversineDistanceKm(
        latitude,
        longitude,
        restaurant.latitude,
        restaurant.longitude
      );

      return {
        id: restaurant._id,
        name: restaurant.storeName,
        cuisine: restaurant.cuisine,
        distanceKm: Number(distanceKm.toFixed(2)),
        averageRating: restaurant.averageRating,
        imageUrl: restaurant.imageUrl,
        foods: menuByRestaurant.get(restaurant._id.toString()) || []
      };
    })
    .filter((restaurant) => restaurant.distanceKm <= maxDistanceKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return successResponse(res, 'Nearby restaurants fetched successfully', response);
}

async function getRestaurantMenu(req, res) {
  const { restaurantId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    const error = new Error('Invalid restaurantId');
    error.statusCode = 400;
    throw error;
  }

  const restaurant = await Restaurant.findOne({ _id: restaurantId, isActive: true });
  if (!restaurant) {
    const error = new Error('Restaurant not found');
    error.statusCode = 404;
    throw error;
  }

  const menu = await MenuItem.find({ restaurantId, isActive: true })
    .sort({ name: 1 })
    .lean();

  const data = menu.map((item) => ({
    id: item._id,
    name: item.name,
    actualPrice: item.actualPrice,
    discountedPrice: item.discountedPrice,
    description: item.description,
    imageUrl: item.imageUrl,
    availableFrom: item.availableFrom,
    quantity: item.quantity
  }));

  return successResponse(res, 'Restaurant menu fetched successfully', data);
}

module.exports = {
  getProfile,
  updateProfile,
  getNearbyRestaurants,
  getRestaurantMenu
};
