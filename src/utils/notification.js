const Notification = require('../models/Notification');
const User = require('../models/User');
const { getMessaging } = require('../config/firebase');

function toStringData(data = {}) {
  const output = {};
  Object.entries(data || {}).forEach(([key, value]) => {
    output[key] = typeof value === 'string' ? value : JSON.stringify(value);
  });
  return output;
}

async function sendPushToUsers(users, title, body, data = {}) {
  const messaging = getMessaging();
  if (!messaging) {
    return;
  }

  const tokens = users.map((user) => user.fcmToken).filter(Boolean);
  if (!tokens.length) {
    return;
  }

  try {
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: toStringData(data)
    });

    const invalidTokenIndices = [];
    response.responses.forEach((result, index) => {
      if (!result.success) {
        const code = result.error?.code || '';
        if (code.includes('registration-token-not-registered') || code.includes('invalid-argument')) {
          invalidTokenIndices.push(index);
        }
      }
    });

    if (invalidTokenIndices.length) {
      const invalidTokens = invalidTokenIndices.map((index) => tokens[index]);
      await User.updateMany({ fcmToken: { $in: invalidTokens } }, { $set: { fcmToken: null } });
    }
  } catch (error) {
    console.error('FCM send failed:', error.message);
  }
}

async function createAndSendNotification(userId, title, body, data = {}) {
  const now = Date.now();

  await Notification.create({
    userId,
    title,
    body,
    data,
    receivedAtEpoch: now,
    read: false
  });

  const user = await User.findById(userId).select('fcmToken');
  if (user?.fcmToken) {
    await sendPushToUsers([user], title, body, data);
  }
}

async function createAndSendBulkNotifications(userIds, title, body, data = {}) {
  const uniqueUserIds = [...new Set(userIds.map((id) => id.toString()))];
  if (!uniqueUserIds.length) {
    return;
  }

  const now = Date.now();
  await Notification.insertMany(
    uniqueUserIds.map((userId) => ({
      userId,
      title,
      body,
      data,
      receivedAtEpoch: now,
      read: false
    }))
  );

  const users = await User.find({ _id: { $in: uniqueUserIds }, fcmToken: { $ne: null } }).select('fcmToken');
  if (users.length) {
    await sendPushToUsers(users, title, body, data);
  }
}

module.exports = {
  createAndSendNotification,
  createAndSendBulkNotifications
};
