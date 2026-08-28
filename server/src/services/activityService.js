const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

async function logActivity({ owner, action, emailId = null, metadata = {} }) {
  try {
    return await ActivityLog.create({
      owner,
      action,
      emailId,
      metadata,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('[ActivityService] Failed to log activity:', err.message);
  }
}

async function createNotification({ owner, type = 'info', title, message, link = '' }) {
  try {
    return await Notification.create({
      owner,
      type,
      title,
      message,
      link,
    });
  } catch (err) {
    console.error('[ActivityService] Failed to create notification:', err.message);
  }
}

async function getUserActivity(userId, { limit = 50, skip = 0, action = null } = {}) {
  const query = { owner: userId };
  if (action) {
    query.action = action;
  }
  return ActivityLog.find(query)
    .populate('emailId', 'subject from receivedAt snippet')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);
}

async function getUserNotifications(userId, { limit = 20, unreadOnly = false } = {}) {
  const query = { owner: userId };
  if (unreadOnly) {
    query.isRead = false;
  }
  return Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);
}

module.exports = {
  logActivity,
  createNotification,
  getUserActivity,
  getUserNotifications,
};
