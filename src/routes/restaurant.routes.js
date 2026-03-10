const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/roles');
const restaurantController = require('../controllers/restaurant.controller');
const { updateRestaurantProfileSchema, upsertMenuItemSchema } = require('../validators/restaurant.validator');
const { statusQuerySchema } = require('../validators/order.validator');

const router = express.Router();

router.use(auth, authorizeRoles('restaurant'));

router.get('/dashboard', asyncHandler(restaurantController.getDashboard));
router.get('/profile', asyncHandler(restaurantController.getProfile));
router.patch('/profile', validate(updateRestaurantProfileSchema), asyncHandler(restaurantController.updateProfile));
router.get('/menu', asyncHandler(restaurantController.listMenu));
router.get('/menu/find-by-name', asyncHandler(restaurantController.findMenuByName));
router.post('/menu/upsert', validate(upsertMenuItemSchema), asyncHandler(restaurantController.upsertMenuItem));
router.get('/orders', validate(statusQuerySchema, 'query'), asyncHandler(restaurantController.listRestaurantOrders));
router.patch('/orders/:id/complete', asyncHandler(restaurantController.completeRestaurantOrder));

module.exports = router;
