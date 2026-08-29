const EmailAccount = require('../models/EmailAccount');
const EmailCache = require('../models/EmailCache');
const googleOAuth = require('../config/googleOAuth');
const env = require('../config/env');
const {
  connectGmailWithTokens,
  createSandboxAccount,
  syncInbox,
} = require('../services/gmailService');
const { logActivity, createNotification } = require('../services/activityService');

async function listAccounts(req, res, next) {
  try {
    const accounts = await EmailAccount.find({ owner: req.user._id, isConnected: true })
      .select('provider emailAddress displayName avatarUrl isConnected isSandbox lastSyncedAt createdAt');
    
    return res.status(200).json({
      success: true,
      data: {
        accounts,
        oauthConfigured: googleOAuth.isConfigured(),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function startOAuth(req, res, next) {
  try {
    if (!googleOAuth.isConfigured()) {
      return res.status(200).json({
        success: true,
        configured: false,
        message:
          'Google OAuth client credentials are not configured in environment. You can connect a Sandbox demo inbox or add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to server/.env.',
        authUrl: null,
        data: {
          configured: false,
          message:
            'Google OAuth client credentials are not configured in environment. You can connect a Sandbox demo inbox or add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to server/.env.',
          authUrl: null,
        },
      });
    }

    const state = Buffer.from(JSON.stringify({ userId: req.user._id.toString() })).toString('base64url');
    const authUrl = googleOAuth.generateAuthUrl(state);

    return res.status(200).json({
      success: true,
      configured: true,
      authUrl,
      data: {
        configured: true,
        authUrl,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function handleOAuthCallback(req, res, next) {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.redirect(`${env.clientUrl}/accounts?error=${encodeURIComponent(oauthError)}`);
    }

    if (!code) {
      return res.redirect(`${env.clientUrl}/accounts?error=missing_code`);
    }

    let userId = null;
    if (state) {
      try {
        const decoded = Buffer.from(state, 'base64url').toString('utf8');
        const parsedState = JSON.parse(decoded);
        userId = parsedState.userId;
      } catch (e) {
        try {
          const parsedState = JSON.parse(state);
          userId = parsedState.userId;
        } catch (e2) {
          userId = state;
        }
      }
    }

    if (!userId && req.user) {
      userId = req.user._id;
    }

    if (!userId) {
      return res.redirect(`${env.clientUrl}/login?error=unauthorized_callback`);
    }

    const tokens = await googleOAuth.exchangeCodeForTokens(code);
    await connectGmailWithTokens(userId, tokens);

    return res.redirect(`${env.clientUrl}/accounts?status=connected`);
  } catch (error) {
    console.error('[EmailAccountController] OAuth callback error:', error);
    return res.redirect(
      `${env.clientUrl}/accounts?error=${encodeURIComponent(error.message || 'oauth_exchange_failed')}`
    );
  }
}

async function createSandbox(req, res, next) {
  try {
    const { customEmail } = req.body;
    const account = await createSandboxAccount(req.user._id, customEmail);
    return res.status(201).json({
      success: true,
      message: 'Sandbox demo email account created and sample emails seeded successfully.',
      data: account,
    });
  } catch (error) {
    next(error);
  }
}

async function disconnectAccount(req, res, next) {
  try {
    const { id } = req.params;
    const account = await EmailAccount.findOne({ _id: id, owner: req.user._id });

    if (!account) {
      return res.status(404).json({
        success: false,
        code: 'ACCOUNT_NOT_FOUND',
        message: 'Email account not found.',
      });
    }

    // Delete cached emails belonging to this account
    await EmailCache.deleteMany({ accountId: id, owner: req.user._id });

    // Permanently remove the email account
    await EmailAccount.deleteOne({ _id: id, owner: req.user._id });

    await logActivity({
      owner: req.user._id,
      action: 'disconnected',
      metadata: { email: account.emailAddress, provider: account.provider },
    });

    await createNotification({
      owner: req.user._id,
      type: 'warning',
      title: 'Email Account Removed',
      message: `Removed ${account.emailAddress} from MailSense AI.`,
    });

    return res.status(200).json({
      success: true,
      message: 'Email account removed successfully.',
    });
  } catch (error) {
    next(error);
  }
}

async function triggerSync(req, res, next) {
  try {
    const { id } = req.params;
    await syncInbox(id, req.user._id);
    return res.status(200).json({
      success: true,
      message: 'Inbox sync completed successfully.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listAccounts,
  startOAuth,
  handleOAuthCallback,
  createSandbox,
  disconnectAccount,
  triggerSync,
};
