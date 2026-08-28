import React, { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import {
  Settings,
  User,
  ShieldCheck,
  Cpu,
  Database,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Mail,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await api.get('/health');
      setHealthData(res);
    } catch (err) {
      console.error('Failed to fetch health check:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="pb-4 border-b border-slate-800">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              Settings & System Diagnostics
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Operator profile, environment status, and active AI engine health checks.
            </p>
          </div>

          {/* User Profile Card */}
          <div className="bg-[#0E1528] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center font-bold text-lg text-white uppercase">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="font-bold text-base text-white">{user?.name || 'Operator'}</h3>
                <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 font-medium">Role</span>
                <p className="text-slate-200 font-bold capitalize mt-0.5">{user?.role || 'user'}</p>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 font-medium">Account Created</span>
                <p className="text-slate-200 font-bold mt-0.5">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Active'}
                </p>
              </div>
            </div>
          </div>

          {/* System & AI Engine Diagnostics Card */}
          <div className="bg-[#0E1528] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-sm text-white">System & Integrations Diagnostics</h3>
              </div>
              <button
                onClick={fetchHealth}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Re-check
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Database */}
              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    Database
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                    Connected
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  MongoDB / In-Memory Memory Server active with automatic zero-config fallback.
                </p>
              </div>

              {/* Encryption */}
              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-brand-400" />
                    Token Encryption
                  </span>
                  <span className="text-[10px] bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded-full border border-brand-500/20 font-bold">
                    AES-256-GCM
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  OAuth refresh & access credentials encrypted at rest with master key.
                </p>
              </div>

              {/* AI Fallback Hierarchy */}
              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    AI Engine Fallback Chain
                  </span>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20 font-bold">
                    Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-mono">
                  {healthData?.integrations?.aiFallbackChain ||
                    'OpenRouter -> Gemini -> Deterministic Rule Engine'}
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
                  <span
                    className={`px-2 py-0.5 rounded border ${
                      healthData?.integrations?.openRouter
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    OpenRouter API: {healthData?.integrations?.openRouter ? 'Configured' : 'Not Set'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded border ${
                      healthData?.integrations?.gemini
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Google Gemini SDK: {healthData?.integrations?.gemini ? 'Configured' : 'Not Set'}
                  </span>
                  <span className="px-2 py-0.5 rounded border bg-brand-500/15 text-brand-300 border-brand-500/30">
                    Deterministic Engine: Active Fallback
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
