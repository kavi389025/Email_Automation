const mongoose = require('mongoose');
const dns = require('dns');
const env = require('./env');

let mongoServer = null;

async function connectDB() {
  const uri = env.mongodbUri;

  if (uri && uri.trim() !== '') {
    try {
      if (uri.startsWith('mongodb+srv://')) {
        try {
          dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
        } catch (dnsErr) {
          // Ignore if cannot set DNS servers
        }
      }
      console.log(`[Database] Attempting connection to MongoDB at ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
      });
      console.log('[Database] Connected to external MongoDB successfully.');
      return mongoose.connection;
    } catch (err) {
      console.warn(`[Database] Failed to connect to external MongoDB: ${err.message}`);
      console.log('[Database] Falling back to in-memory MongoDB server (mongodb-memory-server)...');
    }
  } else {
    console.log('[Database] No MONGODB_URI configured. Starting in-memory MongoDB server...');
  }

  // Fallback to MongoMemoryServer
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    const memoryUri = mongoServer.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[Database] Connected to in-memory MongoDB successfully: ${memoryUri}`);
    return mongoose.connection;
  } catch (memErr) {
    console.error('[Database] Failed to start in-memory MongoDB:', memErr);
    throw memErr;
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
