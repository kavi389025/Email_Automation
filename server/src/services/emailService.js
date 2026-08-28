const EmailCache = require('../models/EmailCache');
const EmailAccount = require('../models/EmailAccount');
const { getProviderForAccount } = require('./gmailService');
const { logActivity } = require('./activityService');

/**
 * Lists emails with filters, search, and pagination
 */
async function listEmails(userId, {
  folder = 'inbox',
  category = null,
  search = '',
  accountId = null,
  page = 1,
  limit = 20,
} = {}) {
  const query = { owner: userId };

  if (accountId) {
    query.accountId = accountId;
  }

  // Folder filtering
  switch (folder.toLowerCase()) {
    case 'inbox':
      query.isTrash = false;
      query.isArchived = false;
      query.isSent = false;
      break;
    case 'starred':
      query.isStarred = true;
      query.isTrash = false;
      break;
    case 'sent':
      query.isSent = true;
      query.isTrash = false;
      break;
    case 'archive':
    case 'archived':
      query.isArchived = true;
      query.isTrash = false;
      break;
    case 'trash':
      query.isTrash = true;
      break;
    case 'all':
      query.isTrash = false;
      break;
    default:
      query.isTrash = false;
      query.isArchived = false;
  }

  if (category && ['work', 'personal', 'promotions', 'updates'].includes(category.toLowerCase())) {
    query.category = category.toLowerCase();
  }

  if (search && search.trim() !== '') {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { subject: searchRegex },
      { snippet: searchRegex },
      { bodyText: searchRegex },
      { 'from.name': searchRegex },
      { 'from.email': searchRegex },
    ];
  }

  const skip = (Math.max(1, page) - 1) * limit;
  const total = await EmailCache.countDocuments(query);
  const emails = await EmailCache.find(query)
    .sort({ receivedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('accountId', 'emailAddress displayName provider isSandbox');

  return {
    emails,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Gets a single email by ID
 */
async function getEmailById(userId, emailId) {
  const email = await EmailCache.findOne({ _id: emailId, owner: userId }).populate(
    'accountId',
    'emailAddress displayName provider isConnected isSandbox'
  );

  if (!email) {
    const error = new Error('Email not found.');
    error.statusCode = 404;
    throw error;
  }

  return email;
}

/**
 * Gets a full thread in chronological order
 */
async function getThreadByThreadId(userId, threadId) {
  const messages = await EmailCache.find({ owner: userId, threadId })
    .sort({ receivedAt: 1 })
    .populate('accountId', 'emailAddress displayName provider isSandbox');

  if (!messages || messages.length === 0) {
    const error = new Error('Thread not found.');
    error.statusCode = 404;
    throw error;
  }

  return messages;
}

/**
 * Updates flags on an email (read, star, archive)
 */
async function updateEmailFlags(userId, emailId, { isRead, isStarred, isArchived }) {
  const email = await EmailCache.findOne({ _id: emailId, owner: userId });
  if (!email) {
    const error = new Error('Email not found.');
    error.statusCode = 404;
    throw error;
  }

  const addLabelIds = [];
  const removeLabelIds = [];

  if (typeof isRead === 'boolean') {
    email.isRead = isRead;
    if (isRead) {
      removeLabelIds.push('UNREAD');
    } else {
      addLabelIds.push('UNREAD');
    }
  }

  if (typeof isStarred === 'boolean') {
    email.isStarred = isStarred;
    if (isStarred) {
      addLabelIds.push('STARRED');
    } else {
      removeLabelIds.push('STARRED');
    }
  }

  if (typeof isArchived === 'boolean') {
    email.isArchived = isArchived;
    if (isArchived) {
      removeLabelIds.push('INBOX');
    } else {
      addLabelIds.push('INBOX');
    }
  }

  await email.save();

  // Reflect back to real Gmail account if not in sandbox
  try {
    const provider = await getProviderForAccount(email.accountId, userId);
    if (addLabelIds.length > 0 || removeLabelIds.length > 0) {
      await provider.modifyLabels(email.gmailMessageId, { addLabelIds, removeLabelIds });
    }
  } catch (providerErr) {
    console.warn(`[EmailService] Provider label modification failed: ${providerErr.message}`);
  }

  // Audit logging
  if (isStarred !== undefined) {
    await logActivity({
      owner: userId,
      action: isStarred ? 'starred' : 'unstarred',
      emailId: email._id,
      metadata: { subject: email.subject },
    });
  }
  if (isRead !== undefined) {
    await logActivity({
      owner: userId,
      action: isRead ? 'read' : 'unread',
      emailId: email._id,
      metadata: { subject: email.subject },
    });
  }
  if (isArchived) {
    await logActivity({
      owner: userId,
      action: 'archived',
      emailId: email._id,
      metadata: { subject: email.subject },
    });
  }

  return email;
}

/**
 * Moves an email to trash
 */
async function trashEmail(userId, emailId) {
  const email = await EmailCache.findOne({ _id: emailId, owner: userId });
  if (!email) {
    const error = new Error('Email not found.');
    error.statusCode = 404;
    throw error;
  }

  email.isTrash = true;
  await email.save();

  // Reflect to provider
  try {
    const provider = await getProviderForAccount(email.accountId, userId);
    await provider.trashMessage(email.gmailMessageId);
  } catch (providerErr) {
    console.warn(`[EmailService] Provider trash call failed: ${providerErr.message}`);
  }

  await logActivity({
    owner: userId,
    action: 'deleted',
    emailId: email._id,
    metadata: { subject: email.subject },
  });

  return { success: true, message: 'Email moved to trash.' };
}

/**
 * Sends a new email, reply, or forward
 */
async function sendEmail(userId, {
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
}) {
  let targetAccountId = accountId;

  if (!targetAccountId) {
    const defaultAccount = await EmailAccount.findOne({ owner: userId, isConnected: true });
    if (!defaultAccount) {
      const error = new Error('No connected email account found to send email from.');
      error.code = 'GMAIL_NOT_CONNECTED';
      error.statusCode = 400;
      throw error;
    }
    targetAccountId = defaultAccount._id;
  }

  const account = await EmailAccount.findOne({ _id: targetAccountId, owner: userId });
  if (!account || !account.isConnected) {
    const error = new Error('Selected email account is not connected.');
    error.code = 'GMAIL_NOT_CONNECTED';
    error.statusCode = 400;
    throw error;
  }

  const provider = await getProviderForAccount(account._id, userId);

  // Send via provider
  const result = await provider.sendMessage({
    to,
    cc,
    bcc,
    subject,
    bodyText,
    bodyHtml,
    inReplyTo,
    references,
    threadId,
  });

  const toList = Array.isArray(to) ? to : [{ email: to }];
  const ccList = cc ? (Array.isArray(cc) ? cc : [{ email: cc }]) : [];
  const bccList = bcc ? (Array.isArray(bcc) ? bcc : [{ email: bcc }]) : [];

  // Cache sent email locally
  const sentRecord = await EmailCache.create({
    owner: userId,
    accountId: account._id,
    gmailMessageId: result.id || `sent_${Date.now()}`,
    threadId: result.threadId || threadId || `thread_${Date.now()}`,
    subject: subject || '(No Subject)',
    snippet: bodyText ? bodyText.substring(0, 150) : '',
    bodyText: bodyText || '',
    bodyHtml: bodyHtml || '',
    from: { name: account.displayName || account.emailAddress, email: account.emailAddress },
    to: toList.map((c) => (typeof c === 'string' ? { name: '', email: c } : c)),
    cc: ccList.map((c) => (typeof c === 'string' ? { name: '', email: c } : c)),
    bcc: bccList.map((c) => (typeof c === 'string' ? { name: '', email: c } : c)),
    labels: ['SENT'],
    isRead: true,
    isSent: true,
    category: 'work',
    receivedAt: new Date(),
  });

  await logActivity({
    owner: userId,
    action: inReplyTo ? 'replied' : 'sent',
    emailId: sentRecord._id,
    metadata: {
      to: toList,
      subject,
      provider: account.provider,
    },
  });

  return sentRecord;
}

/**
 * Gets dashboard metrics for email activity
 */
async function getDashboardStats(userId) {
  const totalEmails = await EmailCache.countDocuments({ owner: userId, isTrash: false });
  const unreadCount = await EmailCache.countDocuments({ owner: userId, isRead: false, isTrash: false });
  const starredCount = await EmailCache.countDocuments({ owner: userId, isStarred: true, isTrash: false });
  const sentCount = await EmailCache.countDocuments({ owner: userId, isSent: true });

  const categories = await EmailCache.aggregate([
    { $match: { owner: userId, isTrash: false } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  const categoryMap = { inbox: 0, work: 0, personal: 0, promotions: 0, updates: 0 };
  categories.forEach((c) => {
    if (c._id && categoryMap[c._id] !== undefined) {
      categoryMap[c._id] = c.count;
    }
  });

  return {
    totalEmails,
    unreadCount,
    starredCount,
    sentCount,
    categories: categoryMap,
  };
}

module.exports = {
  listEmails,
  getEmailById,
  getThreadByThreadId,
  updateEmailFlags,
  trashEmail,
  sendEmail,
  getDashboardStats,
};
