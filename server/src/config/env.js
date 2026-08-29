const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const cleanStr = (val, fallback = '') => (val ? String(val).trim() : fallback);

const env = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: cleanStr(process.env.NODE_ENV, 'development'),
  clientUrl: cleanStr(process.env.CLIENT_URL, 'http://localhost:3000').replace(/\/+$/, ''),
  jwtSecret: cleanStr(process.env.JWT_SECRET, 'fallback_secret_key_mailsense_ai_2026'),
  jwtExpiresIn: cleanStr(process.env.JWT_EXPIRES_IN, '7d'),
  credentialEncryptionKey: cleanStr(process.env.CREDENTIAL_ENCRYPTION_KEY, '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  mongodbUri: cleanStr(process.env.MONGODB_URI, ''),
  google: {
    clientId: cleanStr(process.env.GOOGLE_CLIENT_ID, ''),
    clientSecret: cleanStr(process.env.GOOGLE_CLIENT_SECRET, ''),
    redirectUri: cleanStr(process.env.GOOGLE_REDIRECT_URI, 'http://localhost:5000/api/email-accounts/oauth/callback').replace(/[\r\n\t ]+$/g, ''),
  },
  ai: {
    openRouterApiKey: cleanStr(process.env.OPENROUTER_API_KEY, ''),
    geminiApiKey: cleanStr(process.env.GEMINI_API_KEY, ''),
  },
};

module.exports = env;
