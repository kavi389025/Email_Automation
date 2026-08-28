import React, { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useEmailStore } from '../store/emailStore';
import Link from 'next/link';
import {
  Inbox,
  Star,
  Send,
  Sparkles,
  Mail,
  ShieldCheck,
  TrendingUp,
  Activity,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { openCompose, accounts } = useEmailStore();

  const [stats, setStats] = useState(null);
  const [recentEmails, setRecentEmails] = useState([]);
  const [recentAiActivity, setRecentAiActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, emailsRes, aiRes] = await Promise.allSettled([
          api.get('/emails/stats'),
          api.get('/emails?limit=5'),
          api.get('/ai/activity?limit=5'),
        ]);

        if (statsRes.status === 'fulfilled' && statsRes.value.data) {
          setStats(statsRes.value.data);
        }
        if (emailsRes.status === 'fulfilled' && emailsRes.value.data?.emails) {
          setRecentEmails(emailsRes.value.data.emails);
        }
        if (aiRes.status === 'fulfilled' && aiRes.value.data) {
          setRecentAiActivity(aiRes.value.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-brand-900/40 via-[#0F1930] to-indigo-950/40 border border-brand-500/25 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
            <div className="space-y-1.5 relative z-10">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Good day, {user?.name || 'Operator'} 👋
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                MailSense AI has analyzed your latest inbox updates. You have{' '}
                <span className="text-brand-400 font-bold">
                  {stats?.unreadCount || 0} unread
                </span>{' '}
                emails awaiting your attention.
              </p>
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <button
                onClick={() => openCompose()}
                className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Compose with AI
              </button>
              <Link
                href="/inbox"
                className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
              >
                Open Inbox &rarr;
              </Link>
            </div>
          </div>

          {/* Metric Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#0D1424] border border-slate-800/80 shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Total Synced</span>
                <Inbox className="w-4 h-4 text-brand-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                {stats?.totalEmails || 0}
              </p>
              <span className="text-[10px] text-slate-500">Emails in cache</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#0D1424] border border-slate-800/80 shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Unread Items</span>
                <Mail className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-bold text-rose-400">
                {stats?.unreadCount || 0}
              </p>
              <span className="text-[10px] text-slate-500">Requires triage</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#0D1424] border border-slate-800/80 shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Starred / Priority</span>
                <Star className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-amber-400">
                {stats?.starredCount || 0}
              </p>
              <span className="text-[10px] text-slate-500">High priority flags</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#0D1424] border border-slate-800/80 shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Sent Messages</span>
                <Send className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">
                {stats?.sentCount || 0}
              </p>
              <span className="text-[10px] text-slate-500">Dispatched via Gmail</span>
            </div>
          </div>

          {/* Two Column Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Recent Emails Feed */}
            <div className="lg:col-span-2 bg-[#0E1528] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-brand-400" />
                    <h3 className="font-bold text-sm text-white">Recent Inbox Messages</h3>
                  </div>
                  <Link
                    href="/inbox"
                    className="text-xs text-brand-400 hover:text-brand-300 font-medium hover:underline"
                  >
                    View All &rarr;
                  </Link>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 rounded-xl skeleton-shimmer" />
                    ))}
                  </div>
                ) : recentEmails.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <p className="text-xs">No emails in inbox yet.</p>
                    <Link
                      href="/accounts"
                      className="text-xs text-brand-400 hover:underline font-semibold mt-2 inline-block"
                    >
                      Connect Gmail or Create Sandbox Account &rarr;
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/60">
                    {recentEmails.map((email) => (
                      <Link
                        key={email._id}
                        href={`/inbox/${email._id}`}
                        className="flex items-center justify-between gap-3 py-3 px-2 rounded-xl hover:bg-slate-800/40 transition-colors group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs ${
                                !email.isRead ? 'font-bold text-white' : 'text-slate-300'
                              }`}
                            >
                              {email.from?.name || email.from?.email}
                            </span>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">
                              {email.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-0.5 group-hover:text-slate-200">
                            {email.subject}
                          </p>
                        </div>
                        <span className="text-[11px] text-slate-500 shrink-0 font-mono">
                          {new Date(email.receivedAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: AI Classification Breakdown & Recent Activity */}
            <div className="space-y-6">
              {/* Category Breakdown Card */}
              <div className="bg-[#0E1528] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">AI Inbox Triage</h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-300 font-medium">Work & Operations</span>
                    <span className="font-bold text-slate-200">
                      {stats?.categories?.work || 0}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full"
                      style={{
                        width: `${
                          stats?.totalEmails
                            ? ((stats.categories.work || 0) / stats.totalEmails) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-amber-300 font-medium">Updates & Alerts</span>
                    <span className="font-bold text-slate-200">
                      {stats?.categories?.updates || 0}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{
                        width: `${
                          stats?.totalEmails
                            ? ((stats.categories.updates || 0) / stats.totalEmails) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-purple-300 font-medium">Promotions</span>
                    <span className="font-bold text-slate-200">
                      {stats?.categories?.promotions || 0}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full"
                      style={{
                        width: `${
                          stats?.totalEmails
                            ? ((stats.categories.promotions || 0) / stats.totalEmails) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Connected account card */}
              <div className="bg-[#0E1528] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Account Security
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    AES-256-GCM
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  All Gmail access tokens are encrypted server-side with an application master key.
                </p>
                <Link
                  href="/accounts"
                  className="block text-center text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-xl border border-slate-700 transition-colors"
                >
                  Manage Email Accounts
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
