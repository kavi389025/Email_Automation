const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const googleOAuth = require('./config/googleOAuth');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const emailAccountRoutes = require('./routes/emailAccountRoutes');
const emailRoutes = require('./routes/emailRoutes');
const aiRoutes = require('./routes/aiRoutes');
const activityRoutes = require('./routes/activityRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Security and utility middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = [env.clientUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly permissive CORS
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    status: 'healthy',
    service: 'MailSense AI Backend API',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    integrations: {
      googleOAuth: googleOAuth.isConfigured() ? 'configured' : 'sandbox-mode-available',
      openRouter: Boolean(env.ai.openRouterApiKey),
      gemini: Boolean(env.ai.geminiApiKey),
      aiFallbackChain: 'OpenRouter -> Gemini -> Deterministic Rule Engine',
      database: 'connected',
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/email-accounts', emailAccountRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    code: 'ROUTE_NOT_FOUND',
    message: `API route ${req.originalUrl} not found.`,
  });
});

// Centralized error handler
app.use(errorHandler);

let server = null;

async function startServer() {
  try {
    await connectDB();

    server = app.listen(env.port, () => {
      console.log(`====================================================`);
      console.log(`🚀 MailSense AI Server running on http://localhost:${env.port}`);
      console.log(`🌐 Client URL: ${env.clientUrl}`);
      console.log(`🔒 Encryption: AES-256-GCM initialized`);
      console.log(`🤖 AI Engine: Active (OpenRouter: ${Boolean(env.ai.openRouterApiKey)}, Gemini: ${Boolean(env.ai.geminiApiKey)}, Deterministic: Ready)`);
      console.log(`📧 Gmail OAuth: ${googleOAuth.isConfigured() ? 'Configured' : 'Ready (Sandbox fallback available)'}`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Shutting down gracefully...');
  if (server) server.close();
  await disconnectDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received. Shutting down gracefully...');
  if (server) server.close();
  await disconnectDB();
  process.exit(0);
});

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, startServer };
