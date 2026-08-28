const mongoose = require('mongoose');

const aiActivitySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    emailId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailCache',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ['summary', 'reply', 'classification', 'tone-rewrite', 'extract-actions'],
      required: true,
      index: true,
    },
    prompt: {
      type: String,
      default: '',
    },
    output: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    provider: {
      type: String,
      enum: ['openrouter', 'gemini', 'deterministic'],
      required: true,
    },
    model: {
      type: String,
      default: '',
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    executionTimeMs: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AIActivity', aiActivitySchema);
