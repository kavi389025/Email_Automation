const { getUserActivity } = require('../services/activityService');

async function listActivity(req, res, next) {
  try {
    const { limit = 50, skip = 0, action = null } = req.query;
    const activities = await getUserActivity(req.user._id, {
      limit: parseInt(limit, 10) || 50,
      skip: parseInt(skip, 10) || 0,
      action: action || null,
    });
    return res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listActivity,
};
