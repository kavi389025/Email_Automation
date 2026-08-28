/**
 * Abstract Base Class for Email Providers (e.g. Gmail, Outlook)
 */
class BaseEmailProvider {
  constructor(account) {
    if (new.target === BaseEmailProvider) {
      throw new TypeError('Cannot construct BaseEmailProvider instances directly');
    }
    this.account = account;
  }

  /**
   * Fetches user profile / email address
   */
  async getProfile() {
    throw new Error('Method getProfile() must be implemented.');
  }

  /**
   * Fetches list of messages with optional query/filters
   */
  async fetchMessages({ maxResults = 20, query = '', pageToken = null } = {}) {
    throw new Error('Method fetchMessages() must be implemented.');
  }

  /**
   * Fetches single full message by provider ID
   */
  async fetchMessage(messageId) {
    throw new Error('Method fetchMessage() must be implemented.');
  }

  /**
   * Fetches an entire thread of messages
   */
  async fetchThread(threadId) {
    throw new Error('Method fetchThread() must be implemented.');
  }

  /**
   * Sends an email (new, reply, forward)
   */
  async sendMessage({ to, cc, bcc, subject, bodyText, bodyHtml, inReplyTo, references, threadId }) {
    throw new Error('Method sendMessage() must be implemented.');
  }

  /**
   * Modifies labels (read/unread, star, archive, etc.)
   */
  async modifyLabels(messageId, { addLabelIds = [], removeLabelIds = [] }) {
    throw new Error('Method modifyLabels() must be implemented.');
  }

  /**
   * Moves a message to trash
   */
  async trashMessage(messageId) {
    throw new Error('Method trashMessage() must be implemented.');
  }

  /**
   * Restores a message from trash
   */
  async untrashMessage(messageId) {
    throw new Error('Method untrashMessage() must be implemented.');
  }
}

module.exports = BaseEmailProvider;
