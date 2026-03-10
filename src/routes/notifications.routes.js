const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/roles');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

router.use(auth, authorizeRoles('user'));

router.get('/', asyncHandler(notificationController.listNotifications));
router.patch('/mark-all-read', asyncHandler(notificationController.markAllRead));
router.delete('/clear', asyncHandler(notificationController.clearNotifications));

module.exports = router;
