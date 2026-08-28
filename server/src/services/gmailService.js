const EmailAccount = require('../models/EmailAccount');
const EmailCache = require('../models/EmailCache');
const GmailProvider = require('../integrations/gmailProvider');
const { encrypt } = require('../utils/encryption');
const googleOAuth = require('../config/googleOAuth');
const { logActivity, createNotification } = require('./activityService');

/**
 * Initializes and returns a provider instance for an account
 */
async function getProviderForAccount(accountId, userId) {
  const account = await EmailAccount.findOne({ _id: accountId, owner: userId }).select(
    '+encryptedAccessToken +encryptedRefreshToken'
  );

  if (!account || !account.isConnected) {
    const error = new Error('No connected email account found.');
    error.code = 'GMAIL_NOT_CONNECTED';
    error.statusCode = 400;
    throw error;
  }

  return new GmailProvider(account);
}

/**
 * Connects a Gmail account using OAuth tokens exchanged from code
 */
async function connectGmailWithTokens(userId, tokens) {
  const oAuth2Client = googleOAuth.getAuthenticatedClient(
    tokens.access_token,
    tokens.refresh_token
  );
  const { google } = require('googleapis');
  const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
  const userProfile = await oauth2.userinfo.get();

  const emailAddress = userProfile.data.email;
  const displayName = userProfile.data.name || emailAddress.split('@')[0];
  const avatarUrl = userProfile.data.picture || '';

  const encryptedAccessToken = encrypt(tokens.access_token);
  const encryptedRefreshToken = tokens.refresh_token
    ? encrypt(tokens.refresh_token)
    : undefined;

  let account = await EmailAccount.findOne({ owner: userId, emailAddress });

  if (account) {
    account.displayName = displayName;
    account.avatarUrl = avatarUrl;
    account.isConnected = true;
    account.encryptedAccessToken = encryptedAccessToken;
    if (encryptedRefreshToken) {
      account.encryptedRefreshToken = encryptedRefreshToken;
    }
    account.expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
    account.scopes = tokens.scope ? tokens.scope.split(' ') : [];
    account.isSandbox = false;
    await account.save();
  } else {
    account = await EmailAccount.create({
      owner: userId,
      provider: 'gmail',
      emailAddress,
      displayName,
      avatarUrl,
      isConnected: true,
      scopes: tokens.scope ? tokens.scope.split(' ') : [],
      encryptedAccessToken,
      encryptedRefreshToken,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      isSandbox: false,
    });
  }

  await logActivity({
    owner: userId,
    action: 'connected',
    metadata: { provider: 'gmail', email: emailAddress },
  });

  await createNotification({
    owner: userId,
    type: 'success',
    title: 'Gmail Account Connected',
    message: `Successfully connected ${emailAddress} to MailSense AI.`,
    link: '/inbox',
  });

  // Trigger initial background sync
  syncInbox(account._id, userId).catch((err) =>
    console.error('[GmailService] Initial sync error:', err.message)
  );

  return account;
}

/**
 * Creates or resets a sandbox demo account with rich realistic emails
 */
async function createSandboxAccount(userId, customEmail = null) {
  const emailAddress = customEmail || `operator_${String(userId).substring(0, 6)}@sandbox.mailsense.ai`;
  
  let account = await EmailAccount.findOne({ owner: userId, emailAddress });
  if (!account) {
    account = await EmailAccount.create({
      owner: userId,
      provider: 'gmail',
      emailAddress,
      displayName: 'Sandbox Operator',
      isConnected: true,
      isSandbox: true,
      scopes: googleOAuth.SCOPES,
      lastSyncedAt: new Date(),
    });
  } else {
    account.isConnected = true;
    account.isSandbox = true;
    account.lastSyncedAt = new Date();
    await account.save();
  }

  // Seed sample emails into EmailCache for rich demonstration
  await seedSandboxEmails(account._id, userId, emailAddress);

  await logActivity({
    owner: userId,
    action: 'connected',
    metadata: { provider: 'gmail', email: emailAddress, mode: 'sandbox' },
  });

  await createNotification({
    owner: userId,
    type: 'success',
    title: 'Sandbox Gmail Connected',
    message: `Initialized evaluation inbox for ${emailAddress} with realistic sample emails.`,
    link: '/inbox',
  });

  return account;
}

/**
 * Seeds realistic demonstration emails for the sandbox account
 */
async function seedSandboxEmails(accountId, userId, userEmail) {
  // Clear any existing cache for this account
  await EmailCache.deleteMany({ owner: userId, accountId });

  const sampleEmails = [
    {
      gmailMessageId: `msg_sandbox_${Date.now()}_1`,
      threadId: `thread_sandbox_1`,
      subject: 'Urgent: Q3 Cloud Infrastructure Migration Review & Sign-Off',
      snippet: 'Hi team, please find attached the revised migration schedule for our AWS to GCP transition. We need stakeholder approval by Friday 5 PM EST...',
      bodyText: `Hi Team,

I hope you're having a productive week.

Following up on Monday's architectural review, here is the updated deployment and migration plan for transitioning our primary backend services from AWS to GCP:

1. Database replication sync test scheduled for this Thursday at 2:00 AM UTC.
2. Ingress traffic switchover planned for Sunday window (01:00 - 04:00 AM UTC). Zero downtime expected.
3. Fallback DNS rollbacks tested and verified.

Action Required:
We require sign-off from Engineering, DevOps, and Product heads by this Friday at 5:00 PM EST before we can proceed with the production cutover. Please reply with your confirmation or any blocking concerns.

Best regards,
Sarah Jenkins
Principal Systems Architect | Cloud Operations`,
      from: { name: 'Sarah Jenkins', email: 's.jenkins@cloudops-tech.io' },
      to: [{ name: 'Operator', email: userEmail }],
      labels: ['INBOX', 'IMPORTANT'],
      isRead: false,
      isStarred: true,
      category: 'work',
      priority: 'high',
      receivedAt: new Date(Date.now() - 1000 * 60 * 25), // 25 mins ago
    },
    {
      gmailMessageId: `msg_sandbox_${Date.now()}_2`,
      threadId: `thread_sandbox_2`,
      subject: 'Contract Renewal & Annual Subscription Tier Discount — Enterprise Plan',
      snippet: 'Hello! Your annual enterprise plan is scheduled for renewal on September 15th. We are pleased to offer an exclusive 20% loyalty discount if confirmed...',
      bodyText: `Hello,

Thank you for being a valued partner over the past two years!

Your organization's current Enterprise Subscription is scheduled for renewal on September 15th, 2026. 

Based on your team's expanding API consumption and active seat count, our customer success team has pre-approved an exclusive 20% annual discount if the renewal contract is executed before August 31st.

Would you be open for a brief 15-minute sync this Wednesday at 3:00 PM EST to review the updated terms and seat allocation?

Looking forward to hearing from you.

Warm regards,
Alex Mercer
Account Executive | SaaS Global Networks`,
      from: { name: 'Alex Mercer', email: 'alex.m@saasglobal.com' },
      to: [{ name: 'Operator', email: userEmail }],
      labels: ['INBOX'],
      isRead: true,
      isStarred: false,
      category: 'work',
      priority: 'medium',
      receivedAt: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
    },
    {
      gmailMessageId: `msg_sandbox_${Date.now()}_3`,
      threadId: `thread_sandbox_3`,
      subject: 'Security Alert: New sign-in from Chrome on Windows 11',
      snippet: 'We detected a new sign-in to your account from IP address 192.0.2.14 in New York, USA. If this was you, no action is needed...',
      bodyText: `Security Notification

A new login was detected on your account:
Device: Chrome on Windows 11
Location: New York, USA (IP: 192.0.2.14)
Time: August 27, 2026 14:22 UTC

If this was you, you can safely disregard this message. If you did not perform this login, please change your password immediately and revoke active API sessions from your account security dashboard.

Security Operations Team`,
      from: { name: 'Security Notifications', email: 'no-reply@security-auth.net' },
      to: [{ name: 'Operator', email: userEmail }],
      labels: ['INBOX', 'UPDATES'],
      isRead: true,
      isStarred: false,
      category: 'updates',
      priority: 'medium',
      receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    },
    {
      gmailMessageId: `msg_sandbox_${Date.now()}_4`,
      threadId: `thread_sandbox_4`,
      subject: 'Special Offer: 40% Off Summer Developer Tools & Cloud Compute Credits',
      snippet: 'Upgrade your development workflow today with our exclusive summer flash sale. Valid for the next 48 hours only across all compute instances...',
      bodyText: `DevCommunity Exclusive Flash Sale!

Upgrade your cloud workstation and developer tooling stack with a massive 40% discount across all compute instances and AI inference endpoints for 3 months.

Use coupon code: DEVSUMMER26 at checkout.
Offer expires this Sunday at midnight!

Unsubscribe | Manage Preferences`,
      from: { name: 'DevCloud Promotions', email: 'promotions@devcloud-infra.com' },
      to: [{ name: 'Operator', email: userEmail }],
      labels: ['INBOX', 'PROMOTIONS'],
      isRead: true,
      isStarred: false,
      category: 'promotions',
      priority: 'low',
      receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
  ];

  for (const emailData of sampleEmails) {
    await EmailCache.create({
      owner: userId,
      accountId,
      ...emailData,
    });
  }
}

/**
 * Syncs recent messages from Gmail API into local EmailCache
 */
async function syncInbox(accountId, userId) {
  const account = await EmailAccount.findOne({ _id: accountId, owner: userId }).select(
    '+encryptedAccessToken +encryptedRefreshToken'
  );

  if (!account || !account.isConnected) {
    return;
  }

  if (account.isSandbox) {
    account.lastSyncedAt = new Date();
    await account.save();
    return;
  }

  const provider = new GmailProvider(account);
  const listRes = await provider.fetchMessages({ maxResults: 30 });

  if (listRes && listRes.messages && Array.isArray(listRes.messages)) {
    for (const msgSummary of listRes.messages) {
      try {
        const fullMsg = await provider.fetchMessage(msgSummary.id);
        if (!fullMsg) continue;

        await EmailCache.findOneAndUpdate(
          { owner: userId, gmailMessageId: fullMsg.gmailMessageId },
          {
            owner: userId,
            accountId: account._id,
            gmailMessageId: fullMsg.gmailMessageId,
            threadId: fullMsg.threadId,
            historyId: fullMsg.historyId,
            subject: fullMsg.subject,
            snippet: fullMsg.snippet,
            bodyText: fullMsg.bodyText,
            bodyHtml: fullMsg.bodyHtml,
            from: fullMsg.from,
            to: fullMsg.to,
            cc: fullMsg.cc,
            bcc: fullMsg.bcc,
            replyTo: fullMsg.replyTo,
            labels: fullMsg.labels,
            isRead: fullMsg.isRead,
            isStarred: fullMsg.isStarred,
            isArchived: fullMsg.isArchived,
            isTrash: fullMsg.isTrash,
            isSent: fullMsg.isSent,
            receivedAt: fullMsg.receivedAt,
          },
          { upsert: true, new: true }
        );
      } catch (msgErr) {
        console.error(`[GmailService] Failed to sync message ${msgSummary.id}:`, msgErr.message);
      }
    }
  }

  account.lastSyncedAt = new Date();
  await account.save();
}

module.exports = {
  getProviderForAccount,
  connectGmailWithTokens,
  createSandboxAccount,
  seedSandboxEmails,
  syncInbox,
};
