import React from 'react';
import Link from 'next/link';
import {
  Star,
  Mail,
  MailOpen,
  Archive,
  Trash2,
  Tag,
  Clock,
  Sparkles,
  Inbox,
  CheckSquare,
  Square,
} from 'lucide-react';

export default function InboxList({
  emails = [],
  loading = false,
  onToggleStar,
  onToggleRead,
  onArchive,
  onTrash,
  selectedEmailIds = [],
  onToggleSelect,
  pagination,
  onPageChange,
}) {
  const getCategoryBadge = (category) => {
    switch (category) {
      case 'work':
        return <span className="text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">Work</span>;
      case 'personal':
        return <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">Personal</span>;
      case 'updates':
        return <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">Updates</span>;
      case 'promotions':
        return <span className="text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-medium">Promotions</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="divide-y divide-slate-800/60">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <div className="w-5 h-5 rounded skeleton-shimmer" />
            <div className="w-5 h-5 rounded skeleton-shimmer" />
            <div className="w-8 h-8 rounded-full skeleton-shimmer shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 rounded skeleton-shimmer w-1/4" />
              <div className="h-3.5 rounded skeleton-shimmer w-3/4" />
            </div>
            <div className="w-16 h-3 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4 shadow-xl">
          <Inbox className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">No emails found</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Your inbox is clean or no messages match the current filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="divide-y divide-slate-800/60 flex-1">
        {emails.map((email) => {
          const isSelected = selectedEmailIds.includes(email._id);
          const senderDisplayName =
            email.from?.name || email.from?.email?.split('@')[0] || 'Unknown';

          return (
            <div
              key={email._id}
              className={`group flex items-center gap-3 px-4 py-3.5 transition-all hover:bg-slate-800/40 relative ${
                !email.isRead ? 'bg-[#0E1528]/80 font-medium' : 'bg-transparent text-slate-300'
              }`}
            >
              {/* Star toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar && onToggleStar(email._id, !email.isStarred);
                }}
                className="text-slate-600 hover:text-amber-400 transition-colors p-1"
                title={email.isStarred ? 'Unstar' : 'Star'}
              >
                <Star
                  className={`w-4 h-4 ${
                    email.isStarred
                      ? 'fill-amber-400 text-amber-400'
                      : 'hover:fill-amber-400/20'
                  }`}
                />
              </button>

              {/* Sender Avatar */}
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center text-xs font-bold text-brand-400 shrink-0 uppercase">
                {senderDisplayName.charAt(0)}
              </div>

              {/* Clickable Email Info */}
              <Link
                href={`/inbox/${email._id}`}
                className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 min-w-0"
              >
                {/* Sender Name */}
                <div className="w-36 shrink-0 truncate">
                  <span
                    className={`text-xs ${
                      !email.isRead ? 'text-white font-bold' : 'text-slate-300'
                    }`}
                  >
                    {senderDisplayName}
                  </span>
                </div>

                {/* Subject & Snippet */}
                <div className="flex-1 min-w-0 flex items-center gap-2 truncate">
                  <span
                    className={`text-xs truncate ${
                      !email.isRead ? 'text-white font-semibold' : 'text-slate-200'
                    }`}
                  >
                    {email.subject}
                  </span>
                  <span className="text-xs text-slate-500 truncate hidden md:inline">
                    - {email.snippet}
                  </span>
                </div>

                {/* Badges & Date */}
                <div className="flex items-center gap-2.5 shrink-0">
                  {getCategoryBadge(email.category)}
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatDate(email.receivedAt)}
                  </span>
                </div>
              </Link>

              {/* Quick Hover Actions */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-[#0E1528] px-2 py-1 rounded-lg border border-slate-700/80 shadow-lg transition-opacity absolute right-4">
                <button
                  type="button"
                  onClick={() => onToggleRead && onToggleRead(email._id, !email.isRead)}
                  className="p-1 text-slate-400 hover:text-brand-400 hover:bg-slate-800 rounded transition-colors"
                  title={email.isRead ? 'Mark as unread' : 'Mark as read'}
                >
                  {email.isRead ? <Mail className="w-3.5 h-3.5" /> : <MailOpen className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => onArchive && onArchive(email._id)}
                  className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                  title="Archive"
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onTrash && onTrash(email._id)}
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                  title="Move to trash"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-5 py-3.5 border-t border-slate-800 bg-[#0B101D] flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing {(pagination.page - 1) * pagination.limit + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} emails
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-200 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <span className="font-semibold text-slate-300">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-200 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
