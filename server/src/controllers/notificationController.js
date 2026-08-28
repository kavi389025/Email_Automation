const Notification = require('../models/Notification');
const { getUserNotifications } = require('../services/activityService');

async function listNotifications(req, res, next) {
  try {
    const { unreadOnly } = req.query;
    const notifications = await getUserNotifications(req.user._id, {
      unreadOnly: unreadOnly === 'true',
    });
    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
}

async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, owner: req.user._id },
      { isRead: true },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    await Notification.updateMany({ owner: req.user._id, isRead: false }, { isRead: true });
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead,
};
