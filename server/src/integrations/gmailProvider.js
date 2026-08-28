const { google } = require('googleapis');
const BaseEmailProvider = require('./baseEmailProvider');
const googleOAuth = require('../config/googleOAuth');
const { decrypt } = require('../utils/encryption');

class GmailProvider extends BaseEmailProvider {
  constructor(account) {
    super(account);
    this.gmail = null;
    this.oauth2Client = null;
    this.initClient();
  }

  initClient() {
    if (this.account.isSandbox) {
      return; // Sandbox account does not need real google client
    }

    try {
      const accessToken = this.account.encryptedAccessToken
        ? decrypt(this.account.encryptedAccessToken)
        : null;
      const refreshToken = this.account.encryptedRefreshToken
        ? decrypt(this.account.encryptedRefreshToken)
        : null;

      if (!accessToken && !refreshToken) {
        const error = new Error('No credentials available for this Gmail account.');
        error.code = 'GMAIL_NOT_CONNECTED';
        throw error;
      }

      this.oauth2Client = googleOAuth.getAuthenticatedClient(accessToken, refreshToken);
      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    } catch (err) {
      if (err.code === 'GMAIL_NOT_CONNECTED') throw err;
      const error = new Error(`Failed to initialize Gmail client: ${err.message}`);
      error.code = 'AUTH_EXPIRED';
      throw error;
    }
  }

  async getProfile() {
    if (this.account.isSandbox) {
      return {
        emailAddress: this.account.emailAddress,
        messagesTotal: 42,
        threadsTotal: 28,
        historyId: 'sandbox_history_1001',
      };
    }

    try {
      const res = await this.gmail.users.getProfile({ userId: 'me' });
      return res.data;
    } catch (err) {
      this.handleApiError(err);
    }
  }

  async fetchMessages({ maxResults = 20, query = '', pageToken = null } = {}) {
    if (this.account.isSandbox) {
      return {
        messages: [],
        nextPageToken: null,
        resultSizeEstimate: 0,
      };
    }

    try {
      const res = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query || undefined,
        pageToken: pageToken || undefined,
      });
      return res.data;
    } catch (err) {
      this.handleApiError(err);
    }
  }

  async fetchMessage(messageId) {
    if (this.account.isSandbox) {
      return null;
    }

    try {
      const res = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });
      return this.parseGmailMessage(res.data);
    } catch (err) {
      this.handleApiError(err);
    }
  }

  async fetchThread(threadId) {
    if (this.account.isSandbox) {
      return null;
    }

    try {
      const res = await this.gmail.users.threads.get({
        userId: 'me',
        id: threadId,
        format: 'full',
      });

      const parsedMessages = (res.data.messages || []).map((msg) =>
        this.parseGmailMessage(msg)
      );

      return {
        id: res.data.id,
        historyId: res.data.historyId,
        messages: parsedMessages,
      };
    } catch (err) {
      this.handleApiError(err);
    }
  }

  async sendMessage({ to, cc, bcc, subject, bodyText, bodyHtml, inReplyTo, references, threadId }) {
    if (this.account.isSandbox) {
      const generatedId = `msg_sandbox_${Date.now()}`;
      return {
        id: generatedId,
        threadId: threadId || `thread_sandbox_${Date.now()}`,
        labelIds: ['SENT'],
      };
    }

    try {
      const raw = this.buildRawEmail({
        from: this.account.emailAddress,
        to,
        cc,
        bcc,
        subject,
        bodyText,
        bodyHtml,
        inReplyTo,
        references,
      });

      const res = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw,
          threadId: threadId || undefined,
        },
      });

      return res.data;
    } catch (err) {
      this.handleApiError(err);
    }
  }

  async modifyLabels(messageId, { addLabelIds = [], removeLabelIds = [] }) {
    if (this.account.isSandbox) {
      return { id: messageId, labelIds: addLabelIds };
    }

    try {
      const res = await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds,
          removeLabelIds,
        },
      });
      return res.data;
    } catch (err) {
      this.handleApiError(err);
    }
  }

  async trashMessage(messageId) {
    if (this.account.isSandbox) {
      return { id: messageId };
    }

    try {
      const res = await this.gmail.users.messages.trash({
        userId: 'me',
        id: messageId,
      });
      return res.data;
    } catch (err) {
      this.handleApiError(err);
    }
  }

  async untrashMessage(messageId) {
    if (this.account.isSandbox) {
      return { id: messageId };
    }

    try {
      const res = await this.gmail.users.messages.untrash({
        userId: 'me',
        id: messageId,
      });
      return res.data;
    } catch (err) {
      this.handleApiError(err);
    }
  }

  parseGmailMessage(msg) {
    const headers = msg.payload?.headers || [];
    const getHeader = (name) => {
      const found = headers.find(
        (h) => h.name.toLowerCase() === name.toLowerCase()
      );
      return found ? found.value : '';
    };

    const parseAddress = (str) => {
      if (!str) return { name: '', email: '' };
      const match = str.match(/(.*?)\s*<(.+?)>/);
      if (match) {
        return { name: match[1].replace(/["']/g, '').trim(), email: match[2].trim() };
      }
      return { name: '', email: str.trim() };
    };

    const parseAddressList = (str) => {
      if (!str) return [];
      return str.split(',').map((s) => parseAddress(s.trim())).filter((c) => c.email);
    };

    let bodyText = '';
    let bodyHtml = '';

    const extractBody = (part) => {
      if (!part) return;
      if (part.mimeType === 'text/plain' && part.body?.data) {
        bodyText = Buffer.from(part.body.data, 'base64url').toString('utf8');
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        bodyHtml = Buffer.from(part.body.data, 'base64url').toString('utf8');
      }

      if (part.parts && Array.isArray(part.parts)) {
        part.parts.forEach(extractBody);
      }
    };

    if (msg.payload) {
      extractBody(msg.payload);
      if (!bodyText && !bodyHtml && msg.payload.body?.data) {
        const decoded = Buffer.from(msg.payload.body.data, 'base64url').toString('utf8');
        if (msg.payload.mimeType === 'text/html') {
          bodyHtml = decoded;
        } else {
          bodyText = decoded;
        }
      }
    }

    const labels = msg.labelIds || [];
    const internalDate = msg.internalDate ? new Date(parseInt(msg.internalDate, 10)) : new Date();

    return {
      gmailMessageId: msg.id,
      threadId: msg.threadId,
      historyId: msg.historyId || '',
      subject: getHeader('Subject') || '(No Subject)',
      snippet: msg.snippet || '',
      bodyText: bodyText || msg.snippet || '',
      bodyHtml: bodyHtml || '',
      from: parseAddress(getHeader('From')),
      to: parseAddressList(getHeader('To')),
      cc: parseAddressList(getHeader('Cc')),
      bcc: parseAddressList(getHeader('Bcc')),
      replyTo: getHeader('Reply-To'),
      labels,
      isRead: !labels.includes('UNREAD'),
      isStarred: labels.includes('STARRED'),
      isArchived: !labels.includes('INBOX') && !labels.includes('TRASH') && !labels.includes('SPAM'),
      isTrash: labels.includes('TRASH'),
      isSent: labels.includes('SENT'),
      receivedAt: internalDate,
    };
  }

  buildRawEmail({ from, to, cc, bcc, subject, bodyText, bodyHtml, inReplyTo, references }) {
    const toStr = Array.isArray(to) ? to.map((c) => (typeof c === 'string' ? c : c.email)).join(', ') : to;
    const ccStr = cc ? (Array.isArray(cc) ? cc.map((c) => (typeof c === 'string' ? c : c.email)).join(', ') : cc) : '';
    const bccStr = bcc ? (Array.isArray(bcc) ? bcc.map((c) => (typeof c === 'string' ? c : c.email)).join(', ') : bcc) : '';

    const lines = [
      `From: ${from}`,
      `To: ${toStr}`,
    ];

    if (ccStr) lines.push(`Cc: ${ccStr}`);
    if (bccStr) lines.push(`Bcc: ${bccStr}`);
    if (inReplyTo) lines.push(`In-Reply-To: ${inReplyTo}`);
    if (references) lines.push(`References: ${references}`);

    // Encode subject with UTF-8 support
    const encodedSubject = `=?utf-8?B?${Buffer.from(subject || '').toString('base64')}?=`;
    lines.push(`Subject: ${encodedSubject}`);
    lines.push('MIME-Version: 1.0');

    if (bodyHtml) {
      const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
      lines.push('');
      lines.push(`--${boundary}`);
      lines.push('Content-Type: text/plain; charset=UTF-8');
      lines.push('Content-Transfer-Encoding: 7bit');
      lines.push('');
      lines.push(bodyText || '');
      lines.push('');
      lines.push(`--${boundary}`);
      lines.push('Content-Type: text/html; charset=UTF-8');
      lines.push('Content-Transfer-Encoding: 7bit');
      lines.push('');
      lines.push(bodyHtml);
      lines.push('');
      lines.push(`--${boundary}--`);
    } else {
      lines.push('Content-Type: text/plain; charset=UTF-8');
      lines.push('Content-Transfer-Encoding: 7bit');
      lines.push('');
      lines.push(bodyText || '');
    }

    const email = lines.join('\r\n');
    return Buffer.from(email).toString('base64url');
  }

  handleApiError(err) {
    if (err.status === 401 || err.code === 401 || err.message?.includes('invalid_grant')) {
      const error = new Error('Gmail authorization has expired or was revoked. Please reconnect your account.');
      error.code = 'AUTH_EXPIRED';
      error.status = 401;
      throw error;
    }
    throw err;
  }
}

module.exports = GmailProvider;
