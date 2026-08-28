const env = require('../config/env');

function errorHandler(err, req, res, next) {
  // Never log raw secrets or sensitive tokens
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  // Custom App Error Handling
  if (err.name === 'GmailNotConnectedError' || err.code === 'GMAIL_NOT_CONNECTED') {
    return res.status(400).json({
      success: false,
      code: 'GMAIL_NOT_CONNECTED',
      message: err.message || 'No connected Gmail account found for this user. Please connect your Gmail account.',
    });
  }

  if (err.name === 'AuthExpiredError' || err.code === 'AUTH_EXPIRED') {
    return res.status(401).json({
      success: false,
      code: 'AUTH_EXPIRED',
      message: err.message || 'Gmail authorization has expired or was revoked. Please reconnect your account.',
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      code: 'DUPLICATE_KEY',
      message: `An entry with this ${field} already exists.`,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      code: 'INVALID_ID',
      message: `Invalid ID format for ${err.path}.`,
    });
  }

  // JWT verification errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired session token.',
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred on the server.',
    ...(env.nodeEnv === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
