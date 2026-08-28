const { summarizeEmail } = require('../ai/summarizer');
const { generateReply } = require('../ai/replyGenerator');
const { classifyEmail } = require('../ai/classifier');
const EmailCache = require('../models/EmailCache');
const AIActivity = require('../models/AIActivity');

async function summarize(req, res, next) {
  try {
    const { emailId, threadId } = req.body;
    let email = null;
    let threadMessages = [];

    if (emailId) {
      email = await EmailCache.findOne({ _id: emailId, owner: req.user._id });
    }

    if (threadId) {
      threadMessages = await EmailCache.find({ owner: req.user._id, threadId }).sort({
        receivedAt: 1,
      });
      if (!email && threadMessages.length > 0) {
        email = threadMessages[threadMessages.length - 1];
      }
    }

    if (!email) {
      return res.status(404).json({
        success: false,
        code: 'EMAIL_NOT_FOUND',
        message: 'Email or thread not found for summarization.',
      });
    }

    const summaryResult = await summarizeEmail({
      userId: req.user._id,
      email,
      threadMessages,
    });

    return res.status(200).json({
      success: true,
      data: summaryResult,
    });
  } catch (error) {
    next(error);
  }
}

async function createReply(req, res, next) {
  try {
    const { emailId, tone = 'professional', userInstructions = '' } = req.body;

    const email = await EmailCache.findOne({ _id: emailId, owner: req.user._id });
    if (!email) {
      return res.status(404).json({
        success: false,
        code: 'EMAIL_NOT_FOUND',
        message: 'Email not found for reply generation.',
      });
    }

    let threadMessages = [];
    if (email.threadId) {
      threadMessages = await EmailCache.find({
        owner: req.user._id,
        threadId: email.threadId,
      }).sort({ receivedAt: 1 });
    }

    const replyResult = await generateReply({
      userId: req.user._id,
      email,
      tone,
      userInstructions,
      threadMessages,
    });

    return res.status(200).json({
      success: true,
      data: replyResult,
    });
  } catch (error) {
    next(error);
  }
}

async function classify(req, res, next) {
  try {
    const { emailId } = req.body;
    const email = await EmailCache.findOne({ _id: emailId, owner: req.user._id });

    if (!email) {
      return res.status(404).json({
        success: false,
        code: 'EMAIL_NOT_FOUND',
        message: 'Email not found for classification.',
      });
    }

    const result = await classifyEmail({
      userId: req.user._id,
      email,
    });

    // Optionally update email cache category & priority
    if (result.category) {
      email.category = result.category;
    }
    if (result.priority) {
      email.priority = result.priority;
    }
    await email.save();

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function getActivity(req, res, next) {
  try {
    const { limit = 30, skip = 0 } = req.query;
    const activities = await AIActivity.find({ owner: req.user._id })
      .populate('emailId', 'subject from receivedAt snippet')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip, 10) || 0)
      .limit(parseInt(limit, 10) || 30);

    return res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  summarize,
  createReply,
  classify,
  getActivity,
};
