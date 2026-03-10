const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/roles');
const userController = require('../controllers/user.controller');
const { updateProfileSchema, nearbyRestaurantsQuerySchema } = require('../validators/user.validator');

const router = express.Router();

router.use(auth, authorizeRoles('user'));

router.get('/profile', asyncHandler(userController.getProfile));
router.patch('/profile', validate(updateProfileSchema), asyncHandler(userController.updateProfile));
router.get(
  '/restaurants/nearby',
  validate(nearbyRestaurantsQuerySchema, 'query'),
  asyncHandler(userController.getNearbyRestaurants)
);
router.get('/restaurants/:restaurantId/menu', asyncHandler(userController.getRestaurantMenu));

module.exports = router;
