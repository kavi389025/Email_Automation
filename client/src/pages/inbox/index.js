import React, { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import InboxList from '../../components/InboxList';
import api from '../../services/api';
import { useEmailStore } from '../../store/emailStore';
import {
  Inbox,
  Star,
  Send,
  Archive,
  Trash2,
  Filter,
  Search,
  RefreshCw,
  Plus,
  Tag,
} from 'lucide-react';

export default function InboxPage() {
  const {
    activeFolder,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    openCompose,
    setUnreadCount,
  } = useEmailStore();

  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchEmails = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        folder: activeFolder,
        page: String(page),
        limit: '20',
      });

      if (activeCategory) {
        params.append('category', activeCategory);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const res = await api.get(`/emails?${params.toString()}`);
      if (res.data) {
        setEmails(res.data.emails || []);
        setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
      }

      // Update unread count
      const statsRes = await api.get('/emails/stats');
      if (statsRes.data) {
        setUnreadCount(statsRes.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails(1);
  }, [activeFolder, activeCategory, searchQuery]);

  const handleToggleStar = async (emailId, isStarred) => {
    try {
      await api.patch(`/emails/${emailId}`, { isStarred });
      setEmails((prev) =>
        prev.map((m) => (m._id === emailId ? { ...m, isStarred } : m))
      );
    } catch (err) {
      console.error('Toggle star failed:', err);
    }
  };

  const handleToggleRead = async (emailId, isRead) => {
    try {
      await api.patch(`/emails/${emailId}`, { isRead });
      setEmails((prev) =>
        prev.map((m) => (m._id === emailId ? { ...m, isRead } : m))
      );
    } catch (err) {
      console.error('Toggle read failed:', err);
    }
  };

  const handleArchive = async (emailId) => {
    try {
      await api.patch(`/emails/${emailId}`, { isArchived: true });
      setEmails((prev) => prev.filter((m) => m._id !== emailId));
    } catch (err) {
      console.error('Archive failed:', err);
    }
  };

  const handleTrash = async (emailId) => {
    try {
      await api.delete(`/emails/${emailId}`);
      setEmails((prev) => prev.filter((m) => m._id !== emailId));
    } catch (err) {
      console.error('Trash failed:', err);
    }
  };

  const folderTitles = {
    inbox: 'Inbox',
    starred: 'Starred Emails',
    sent: 'Sent Messages',
    archive: 'Archived Messages',
    trash: 'Trash',
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex-1 flex flex-col min-h-0 bg-[#090D16]">
          {/* Inbox Header Bar */}
          <div className="p-4 sm:px-6 border-b border-slate-800 bg-[#0C1222] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-white tracking-tight">
                {folderTitles[activeFolder] || 'Emails'}
              </h1>
              {pagination.total > 0 && (
                <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-mono">
                  {pagination.total}
                </span>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setActiveCategory(null)}
                className={`text-xs px-3 py-1 rounded-xl font-medium transition-all ${
                  !activeCategory
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              {['work', 'personal', 'updates', 'promotions'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={`text-xs capitalize px-3 py-1 rounded-xl font-medium transition-all ${
                    activeCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}

              <button
                onClick={() => fetchEmails(pagination.page)}
                title="Refresh list"
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors ml-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Email List Content */}
          <div className="flex-1 overflow-y-auto">
            <InboxList
              emails={emails}
              loading={loading}
              onToggleStar={handleToggleStar}
              onToggleRead={handleToggleRead}
              onArchive={handleArchive}
              onTrash={handleTrash}
              selectedEmailIds={selectedIds}
              pagination={pagination}
              onPageChange={(newPage) => fetchEmails(newPage)}
            />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
