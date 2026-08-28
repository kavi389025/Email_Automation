const mongoose = require('mongoose');

const emailAccountSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['gmail', 'outlook'],
      default: 'gmail',
    },
    emailAddress: {
      type: String,
      required: true,
      trim: true,
    },
    displayName: {
      type: String,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    isConnected: {
      type: Boolean,
      default: true,
    },
    scopes: {
      type: [String],
      default: [],
    },
    encryptedAccessToken: {
      type: String,
      default: null,
      select: false, // Never return tokens by default
    },
    encryptedRefreshToken: {
      type: String,
      default: null,
      select: false,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isSandbox: {
      type: Boolean,
      default: false,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('EmailAccount', emailAccountSchema);
