import React, { useEffect, useState } from 'react';
import { useEmailStore } from '../../store/emailStore';
import api from '../../services/api';
import { X, CheckCheck, Bell, Info, CheckCircle2, AlertTriangle, AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsDrawer() {
  const { isNotificationsOpen, setNotificationsOpen, notifications, setNotifications } = useEmailStore();
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      if (res.data) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isNotificationsOpen) {
      fetchNotifications();
    }
  }, [isNotificationsOpen]);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(
        notifications.map((n) => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(
        notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  if (!isNotificationsOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-brand-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setNotificationsOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0F172A] border-l border-slate-800 text-slate-100 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-400" />
              <h2 className="font-semibold text-lg text-white">Notifications</h2>
              <span className="ml-2 text-xs bg-brand-500/20 text-brand-300 font-medium px-2 py-0.5 rounded-full border border-brand-500/30">
                {notifications.filter((n) => !n.isRead).length} new
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllRead}
                title="Mark all as read"
                className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
              <button
                onClick={() => setNotificationsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && notifications.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-xl skeleton-shimmer" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Bell className="w-12 h-12 mx-auto mb-3 text-slate-600 stroke-[1.5]" />
                <p className="font-medium text-slate-300">No notifications</p>
                <p className="text-xs text-slate-500 mt-1">You are all caught up!</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  onClick={() => !item.isRead && handleMarkOneRead(item._id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    item.isRead
                      ? 'bg-slate-900/40 border-slate-800/80 text-slate-400'
                      : 'bg-slate-800/60 border-brand-500/30 text-slate-200 shadow-sm'
                  } hover:border-slate-700 hover:bg-slate-800/80`}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(item.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-sm text-slate-100 truncate">
                          {item.title}
                        </h4>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-brand-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs mt-1 text-slate-300 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {item.link && (
                          <Link
                            href={item.link}
                            onClick={() => setNotificationsOpen(false)}
                            className="text-brand-400 hover:text-brand-300 font-medium hover:underline"
                          >
                            View details &rarr;
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
