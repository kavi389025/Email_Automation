const dns = require('dns');

// Configure reliable DNS servers for MongoDB SRV resolution (especially on cloud providers & Windows)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (dnsErr) {
  // Ignore if unable to configure DNS
}

const mongoose = require('mongoose');
const env = require('./env');

let mongoServer = null;

async function connectDB() {
  const uri = env.mongodbUri;

  if (uri && uri.trim() !== '') {
    try {
      console.log(`[Database] Attempting connection to MongoDB at ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log('[Database] Connected to external MongoDB successfully.');
      return mongoose.connection;
    } catch (err) {
      console.warn(`[Database] Failed to connect to external MongoDB: ${err.message}`);
      if (env.nodeEnv === 'production') {
        console.error('[Database] CRITICAL: Running in production. MongoMemoryServer fallback is disabled to prevent container freeze. Please check MONGODB_URI and Atlas Network Access.');
        return null;
      }
      console.log('[Database] Falling back to in-memory MongoDB server (mongodb-memory-server)...');
    }
  } else {
    if (env.nodeEnv === 'production') {
      console.error('[Database] CRITICAL: No MONGODB_URI provided in production environment variables.');
      return null;
    }
    console.log('[Database] No MONGODB_URI configured. Starting in-memory MongoDB server...');
  }

  // Fallback to MongoMemoryServer ONLY in development/test
  if (env.nodeEnv !== 'production') {
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[Database] Connected to in-memory MongoDB successfully: ${memoryUri}`);
      return mongoose.connection;
    } catch (memErr) {
      console.error('[Database] Failed to start in-memory MongoDB:', memErr);
    }
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('[Database] Disconnected from MongoDB.');
  } catch (err) {
    console.error('[Database] Error during disconnect:', err);
  }
}

module.exports = {
  connectDB,
  disconnectDB,
};

