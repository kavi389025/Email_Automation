const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {
  // Ignore
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoose = require('mongoose');
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

const allowedOrigins = [
  env.clientUrl,
  'https://mailsenseaiautomation.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin, matched origin, or any Vercel preview domain
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
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

// Health check endpoint (support both /api/health, /health, /api, and /)
const healthHandler = (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
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
      database: isDbConnected ? 'connected' : 'connecting-or-offline',
    },
  });
};

app.get(['/api/health', '/health', '/api', '/'], healthHandler);

// API Routes - mounted on both /api/... and /... for universal client compatibility
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/email-accounts', '/email-accounts'], emailAccountRoutes);
app.use(['/api/emails', '/emails'], emailRoutes);
app.use(['/api/ai', '/ai'], aiRoutes);
app.use(['/api/activity', '/activity'], activityRoutes);
app.use(['/api/notifications', '/notifications'], notificationRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    code: 'ROUTE_NOT_FOUND',
    message: `Route ${req.originalUrl} not found.`,
  });
});

// Centralized error handler
app.use(errorHandler);

let server = null;

async function startServer() {
  const port = env.port || 5000;
  // Bind port on 0.0.0.0 immediately so Render health checks pass without delay
  server = app.listen(port, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 MailSense AI Server running on port ${port}`);
    console.log(`🌐 Client URL: ${env.clientUrl}`);
    console.log(`🔒 Encryption: AES-256-GCM initialized`);
    console.log(`🤖 AI Engine: Active (OpenRouter: ${Boolean(env.ai.openRouterApiKey)}, Gemini: ${Boolean(env.ai.geminiApiKey)})`);
    console.log(`📧 Gmail OAuth: ${googleOAuth.isConfigured() ? 'Configured' : 'Ready (Sandbox fallback available)'}`);
    console.log(`====================================================`);
  });

  // Connect to Database
  try {
    await connectDB();
  } catch (err) {
    console.error('[Database] Connection error on startup:', err.message);
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

