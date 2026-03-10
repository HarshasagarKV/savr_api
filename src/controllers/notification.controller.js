const Notification = require('../models/Notification');
const { successResponse } = require('../utils/apiResponse');

async function listNotifications(req, res) {
  const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
  return successResponse(res, 'Notifications fetched successfully', notifications);
}

async function markAllRead(req, res) {
  await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
  return successResponse(res, 'All notifications marked as read', {});
}

async function clearNotifications(req, res) {
  await Notification.deleteMany({ userId: req.user._id });
  return successResponse(res, 'Notifications cleared', {});
}

module.exports = {
  listNotifications,
  markAllRead,
  clearNotifications
};
