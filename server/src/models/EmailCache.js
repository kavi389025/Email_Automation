const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    email: { type: String, required: true },
  },
  { _id: false }
);

const emailCacheSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailAccount',
      required: true,
      index: true,
    },
    gmailMessageId: {
      type: String,
      required: true,
      index: true,
    },
    threadId: {
      type: String,
      required: true,
      index: true,
    },
    historyId: {
      type: String,
      default: '',
    },
    subject: {
      type: String,
      default: '(No Subject)',
      index: true,
    },
    snippet: {
      type: String,
      default: '',
    },
    bodyText: {
      type: String,
      default: '',
    },
    bodyHtml: {
      type: String,
      default: '',
    },
    from: {
      type: contactSchema,
      required: true,
    },
    to: {
      type: [contactSchema],
      default: [],
    },
    cc: {
      type: [contactSchema],
      default: [],
    },
    bcc: {
      type: [contactSchema],
      default: [],
    },
    replyTo: {
      type: String,
      default: '',
    },
    labels: {
      type: [String],
      default: ['INBOX'],
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    isStarred: {
      type: Boolean,
      default: false,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    isTrash: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
    isSent: {
      type: Boolean,
      default: false,
      index: true,
    },
    category: {
      type: String,
      enum: ['inbox', 'work', 'personal', 'promotions', 'updates'],
      default: 'inbox',
      index: true,
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    receivedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast user email querying & search
emailCacheSchema.index({ owner: 1, accountId: 1, receivedAt: -1 });
emailCacheSchema.index({ owner: 1, gmailMessageId: 1 }, { unique: true });

module.exports = mongoose.model('EmailCache', emailCacheSchema);
