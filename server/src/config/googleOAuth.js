const { google } = require('googleapis');
const env = require('./env');

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
];

function isConfigured() {
  return Boolean(
    env.google.clientId &&
    env.google.clientId.trim() !== '' &&
    env.google.clientSecret &&
    env.google.clientSecret.trim() !== ''
  );
}

function getOAuth2Client() {
  const clientId = (env.google.clientId || '').trim();
  const clientSecret = (env.google.clientSecret || '').trim();
  const redirectUri = (env.google.redirectUri || '').trim().replace(/[\r\n\t ]+$/g, '');

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}


function generateAuthUrl(state = '') {
  const oAuth2Client = getOAuth2Client();
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state,
  });
}

async function exchangeCodeForTokens(code) {
  const oAuth2Client = getOAuth2Client();
  const { tokens } = await oAuth2Client.getToken(code);
  return tokens;
}

function getAuthenticatedClient(accessToken, refreshToken) {
  const oAuth2Client = getOAuth2Client();
  oAuth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return oAuth2Client;
}

module.exports = {
  SCOPES,
  isConfigured,
  getOAuth2Client,
  generateAuthUrl,
  exchangeCodeForTokens,
  getAuthenticatedClient,
};
