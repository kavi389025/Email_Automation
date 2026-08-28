const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        'sent',
        'archived',
        'deleted',
        'starred',
        'unstarred',
        'read',
        'unread',
        'replied',
        'forwarded',
        'connected',
        'disconnected',
      ],
      required: true,
      index: true,
    },
    emailId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailCache',
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
