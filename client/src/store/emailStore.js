import { create } from 'zustand';

export const useEmailStore = create((set) => ({
  activeFolder: 'inbox',
  activeCategory: null,
  searchQuery: '',
  selectedAccountId: null,
  accounts: [],
  unreadCount: 0,
  isComposeOpen: false,
  composeData: {
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    bodyText: '',
    inReplyTo: null,
    references: null,
    threadId: null,
  },
  isNotificationsOpen: false,
  notifications: [],
  unreadNotificationsCount: 0,

  setActiveFolder: (folder) => set({ activeFolder: folder, activeCategory: null }),
  setActiveCategory: (category) => set({ activeCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedAccountId: (accountId) => set({ selectedAccountId: accountId }),
  setAccounts: (accounts) => set({ accounts }),
  setUnreadCount: (count) => set({ unreadCount: count }),

  openCompose: (initialData = {}) =>
    set({
      isComposeOpen: true,
      composeData: {
        to: initialData.to || '',
        cc: initialData.cc || '',
        bcc: initialData.bcc || '',
        subject: initialData.subject || '',
        bodyText: initialData.bodyText || '',
        inReplyTo: initialData.inReplyTo || null,
        references: initialData.references || null,
        threadId: initialData.threadId || null,
      },
    }),

  closeCompose: () =>
    set({
      isComposeOpen: false,
      composeData: {
        to: '',
        cc: '',
        bcc: '',
        subject: '',
        bodyText: '',
        inReplyTo: null,
        references: null,
        threadId: null,
      },
    }),

  setNotificationsOpen: (isOpen) => set({ isNotificationsOpen: isOpen }),
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadNotificationsCount: notifications.filter((n) => !n.isRead).length,
    }),
}));
