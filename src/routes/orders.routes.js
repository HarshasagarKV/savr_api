const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/roles');
const orderController = require('../controllers/order.controller');
const { createOrderSchema, ratingSchema, statusQuerySchema } = require('../validators/order.validator');

const router = express.Router();

router.use(auth, authorizeRoles('user'));

router.post('/', validate(createOrderSchema), asyncHandler(orderController.createOrder));
router.get('/', validate(statusQuerySchema, 'query'), asyncHandler(orderController.listMyOrders));
router.get('/:id', asyncHandler(orderController.getMyOrderById));
router.patch('/:id/complete', asyncHandler(orderController.completeMyOrder));
router.patch('/:id/rating', validate(ratingSchema), asyncHandler(orderController.rateMyOrder));

module.exports = router;
