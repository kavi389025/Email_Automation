import React, { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';
import api from '../services/api';
import {
  Activity,
  Sparkles,
  Clock,
  CheckCircle2,
  Mail,
  Send,
  Trash2,
  Star,
  Archive,
  Cpu,
  Layers,
  Search,
} from 'lucide-react';

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'ai'
  const [auditLogs, setAuditLogs] = useState([]);
  const [aiActivities, setAiActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const [auditRes, aiRes] = await Promise.allSettled([
        api.get('/activity?limit=50'),
        api.get('/ai/activity?limit=50'),
      ]);

      if (auditRes.status === 'fulfilled' && auditRes.value.data) {
        setAuditLogs(auditRes.value.data);
      }
      if (aiRes.status === 'fulfilled' && aiRes.value.data) {
        setAiActivities(aiRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionIcon = (action) => {
    switch (action) {
      case 'sent':
      case 'replied':
        return <Send className="w-4 h-4 text-emerald-400" />;
      case 'deleted':
        return <Trash2 className="w-4 h-4 text-rose-400" />;
      case 'starred':
        return <Star className="w-4 h-4 text-amber-400 fill-amber-400" />;
      case 'archived':
        return <Archive className="w-4 h-4 text-slate-400" />;
      case 'connected':
        return <CheckCircle2 className="w-4 h-4 text-brand-400" />;
      default:
        return <Mail className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-400" />
                Activity & AI Audit Log
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Complete traceability of email actions, OAuth operations, and AI generation history.
              </p>
            </div>

            {/* Tab switch */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('audit')}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === 'audit'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                User Actions ({auditLogs.length})
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'ai'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Invocations ({aiActivities.length})
              </button>
            </div>
          </div>

          {/* Tab 1: User Audit Logs */}
          {activeTab === 'audit' && (
            <div className="bg-[#0E1528] border border-slate-800 rounded-2xl p-5 shadow-xl">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 rounded-xl skeleton-shimmer" />
                  ))}
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  No user activity recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {auditLogs.map((log) => (
                    <div
                      key={log._id}
                      className="py-3.5 px-2 flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                          {getActionIcon(log.action)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-200 capitalize">
                            {log.action} email
                          </p>
                          <p className="text-slate-400 truncate text-[11px] mt-0.5">
                            {log.emailId?.subject ||
                              log.metadata?.subject ||
                              log.metadata?.email ||
                              'Operation executed'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: AI Invocations Log */}
          {activeTab === 'ai' && (
            <div className="bg-[#0E1528] border border-slate-800 rounded-2xl p-5 shadow-xl">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 rounded-xl skeleton-shimmer" />
                  ))}
                </div>
              ) : aiActivities.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  No AI actions executed yet. Open an email to generate a summary or draft!
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {aiActivities.map((item) => (
                    <div
                      key={item._id}
                      className="py-3.5 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200 capitalize">
                              AI {item.type}
                            </span>
                            <span className="text-[10px] bg-slate-900 border border-slate-700 text-slate-400 px-2 py-0.2 rounded-full font-mono flex items-center gap-1">
                              <Cpu className="w-2.5 h-2.5 text-indigo-400" />
                              {item.provider}
                            </span>
                          </div>
                          <p className="text-slate-400 truncate text-[11px] mt-0.5">
                            Target: {item.emailId?.subject || 'Email task'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center text-[11px] text-slate-500 font-mono shrink-0">
                        <span>{item.executionTimeMs || 100}ms</span>
                        <span>
                          {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
