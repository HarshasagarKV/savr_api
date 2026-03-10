const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/roles');
const adminController = require('../controllers/admin.controller');
const {
  adminUsersQuerySchema,
  paginationQuerySchema,
  adminOrdersQuerySchema,
  statusUpdateSchema
} = require('../validators/admin.validator');

const router = express.Router();

router.use(auth, authorizeRoles('admin'));

router.get('/overview', asyncHandler(adminController.overview));
router.get('/users', validate(adminUsersQuerySchema, 'query'), asyncHandler(adminController.listUsers));
router.patch('/users/:id/status', validate(statusUpdateSchema), asyncHandler(adminController.updateUserStatus));
router.get(
  '/restaurants',
  validate(paginationQuerySchema, 'query'),
  asyncHandler(adminController.listRestaurants)
);
router.patch(
  '/restaurants/:id/status',
  validate(statusUpdateSchema),
  asyncHandler(adminController.updateRestaurantStatus)
);
router.get('/orders', validate(adminOrdersQuerySchema, 'query'), asyncHandler(adminController.listOrders));

module.exports = router;
