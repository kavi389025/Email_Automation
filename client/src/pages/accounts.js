import React, { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';
import api from '../services/api';
import { useEmailStore } from '../store/emailStore';
import { useRouter } from 'next/router';
import {
  Mail,
  ShieldCheck,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
  ExternalLink,
  Cpu,
  Loader2,
} from 'lucide-react';

export default function AccountsPage() {
  const router = useRouter();
  const { accounts, setAccounts, selectedAccountId, setSelectedAccountId } = useEmailStore();

  const [loading, setLoading] = useState(true);
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [bannerMessage, setBannerMessage] = useState(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/email-accounts');
      if (res.data) {
        setAccounts(res.data.accounts || []);
        setOauthConfigured(res.data.oauthConfigured || false);
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();

    // Check query params for OAuth return status
    if (router.query.status === 'connected') {
      setBannerMessage({
        type: 'success',
        text: 'Gmail account successfully connected via Google OAuth 2.0!',
      });
    } else if (router.query.error) {
      setBannerMessage({
        type: 'error',
        text: `OAuth connection error: ${router.query.error}`,
      });
    }
  }, [router.query]);

  const handleStartOAuth = async () => {
    try {
      setActionLoading(true);
      const res = await api.get('/email-accounts/oauth/start');
      const authUrl = res?.data?.authUrl || res?.authUrl;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        setBannerMessage({
          type: 'info',
          text:
            res?.data?.message ||
            res?.message ||
            'Google OAuth credentials not configured. Use Sandbox Mode for local evaluation.',
        });
      }
    } catch (err) {
      console.error('Failed to initiate OAuth:', err);
      setBannerMessage({
        type: 'error',
        text: err.message || 'Failed to start Google OAuth flow.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSandbox = async () => {
    try {
      setActionLoading(true);
      const res = await api.post('/email-accounts/sandbox', {
        customEmail: `operator_${Date.now().toString().slice(-4)}@sandbox.mailsense.ai`,
      });
      setBannerMessage({
        type: 'success',
        text: 'Sandbox evaluation inbox created and seeded with realistic sample emails!',
      });
      await fetchAccounts();
    } catch (err) {
      console.error('Failed to create sandbox:', err);
      setBannerMessage({
        type: 'error',
        text: err.message || 'Failed to create sandbox inbox.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async (accountId) => {
    if (!confirm('Are you sure you want to remove this email account?')) return;
    try {
      setActionLoading(true);
      await api.delete(`/email-accounts/${accountId}`);
      if (selectedAccountId === accountId) {
        setSelectedAccountId(null);
      }
      setBannerMessage({
        type: 'info',
        text: 'Email account removed successfully.',
      });
      await fetchAccounts();
    } catch (err) {
      console.error('Disconnect failed:', err);
      setBannerMessage({
        type: 'error',
        text: err.message || 'Failed to remove email account.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSync = async (accountId) => {
    try {
      setActionLoading(true);
      await api.post(`/email-accounts/${accountId}/sync`);
      setBannerMessage({
        type: 'success',
        text: 'Inbox synchronized successfully with Gmail.',
      });
      await fetchAccounts();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setActionLoading(false);
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
                <Mail className="w-5 h-5 text-brand-400" />
                Connected Email Accounts
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Manage your Gmail and webmail connections with encrypted token storage.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleCreateSandbox}
                disabled={actionLoading}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Add Sandbox Demo Inbox
              </button>

              <button
                onClick={handleStartOAuth}
                disabled={actionLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-brand-600/30 transition-all hover:scale-105 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                Connect Gmail (OAuth)
              </button>
            </div>
          </div>

          {/* Banner message */}
          {bannerMessage && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-3 border ${
                bannerMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : bannerMessage.type === 'error'
                  ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                  : 'bg-brand-950/40 border-brand-500/30 text-brand-300'
              }`}
            >
              {bannerMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : bannerMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              ) : (
                <Sparkles className="w-4 h-4 shrink-0 text-brand-400" />
              )}
              <span>{bannerMessage.text}</span>
            </div>
          )}

          {/* OAuth status card */}
          <div className="bg-[#0E1528] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">OAuth 2.0 Security & Encryption</h3>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                AES-256-GCM Active
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              MailSense AI connects to Google via OAuth 2.0. We never request, see, or store your email password. All refresh and access tokens are encrypted with application-level cryptographic keys at rest.
            </p>
          </div>

          {/* Connected Accounts List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Accounts ({accounts.length})
            </h3>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 rounded-2xl skeleton-shimmer" />
                ))}
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-16 bg-[#0E1528] border border-slate-800 rounded-2xl p-8 space-y-4">
                <Mail className="w-12 h-12 text-slate-600 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-white">No Email Account Connected</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Connect your real Gmail account via Google OAuth or create an Instant Sandbox Demo Inbox to test all features.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={handleCreateSandbox}
                    className="text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl transition-all"
                  >
                    ✨ Initialize Sandbox Demo
                  </button>
                  <button
                    onClick={handleStartOAuth}
                    className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl border border-slate-700 transition-all"
                  >
                    Connect Real Gmail
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((acc) => (
                  <div
                    key={acc._id}
                    className="bg-[#0E1528] border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm uppercase shrink-0">
                        {acc.emailAddress.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">{acc.displayName || acc.emailAddress}</h4>
                          {acc.isSandbox ? (
                            <span className="text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.2 rounded-full font-medium">
                              Sandbox Mode
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 rounded-full font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Gmail OAuth
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{acc.emailAddress}</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Last Synced:{' '}
                          {acc.lastSyncedAt
                            ? new Date(acc.lastSyncedAt).toLocaleString()
                            : 'Just now'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleSync(acc._id)}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-brand-400" />
                        Sync Now
                      </button>
                      <button
                        onClick={() => handleDisconnect(acc._id)}
                        className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-2 rounded-xl border border-rose-500/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Disconnect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
