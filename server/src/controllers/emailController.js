const emailService = require('../services/emailService');

async function listEmails(req, res, next) {
  try {
    const { folder, category, search, accountId, page, limit } = req.query;
    const result = await emailService.listEmails(req.user._id, {
      folder,
      category,
      search,
      accountId,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
    });
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function getStats(req, res, next) {
  try {
    const stats = await emailService.getDashboardStats(req.user._id);
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

async function getEmail(req, res, next) {
  try {
    const { id } = req.params;
    const email = await emailService.getEmailById(req.user._id, id);
    return res.status(200).json({
      success: true,
      data: email,
    });
  } catch (error) {
    next(error);
  }
}

async function getThread(req, res, next) {
  try {
    const { threadId } = req.params;
    const thread = await emailService.getThreadByThreadId(req.user._id, threadId);
    return res.status(200).json({
      success: true,
      data: thread,
    });
  } catch (error) {
    next(error);
  }
}

async function updateFlags(req, res, next) {
  try {
    const { id } = req.params;
    const { isRead, isStarred, isArchived } = req.body;
    const updated = await emailService.updateEmailFlags(req.user._id, id, {
      isRead,
      isStarred,
      isArchived,
    });
    return res.status(200).json({
      success: true,
      message: 'Email updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

async function trashEmail(req, res, next) {
  try {
    const { id } = req.params;
    const result = await emailService.trashEmail(req.user._id, id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function sendEmail(req, res, next) {
  try {
    const {
      accountId,
      to,
      cc,
      bcc,
      subject,
      bodyText,
      bodyHtml,
      inReplyTo,
      references,
      threadId,
      originalEmailId,
    } = req.body;

    const result = await emailService.sendEmail(req.user._id, {
      accountId,
      to,
      cc,
      bcc,
      subject,
      bodyText,
      bodyHtml,
      inReplyTo,
      references,
      threadId,
      originalEmailId,
    });

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listEmails,
  getStats,
  getEmail,
  getThread,
  updateFlags,
  trashEmail,
  sendEmail,
};
