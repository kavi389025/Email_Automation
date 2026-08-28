import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Mail,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Lock,
  Cpu,
  Layers,
  Inbox,
  Send,
  Sliders,
  Calendar,
  Flame,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const [selectedTone, setSelectedTone] = useState('professional');

  const demoResponses = {
    professional:
      'Hi Sarah,\n\nThank you for sharing the updated Q3 infrastructure migration schedule. I have reviewed the proposed Thursday replication tests and Sunday cutover window. Everything is aligned with our engineering goals, and I am pleased to provide sign-off to proceed as planned.\n\nPlease keep me updated on the test outcomes.\n\nBest regards,\nAlex',
    friendly:
      'Hey Sarah!\n\nThanks so much for the clear update on the GCP transition! The migration schedule looks fantastic and very well thought out. Consider this my enthusiastic sign-off for the deployment this week. Best of luck with the database replication test on Thursday!\n\nCheers,\nAlex',
    formal:
      'Dear Ms. Jenkins,\n\nI acknowledge receipt of the Q3 Cloud Infrastructure Migration schedule. Following a comprehensive review of the deployment documentation, I hereby grant formal authorization for the production cutover scheduled for Sunday.\n\nRespectfully,\nAlex Mercer',
    concise:
      'Hi Sarah,\n\nApproved. The schedule for Thursday replication and Sunday cutover looks good.\n\nThanks,\nAlex',
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 selection:bg-brand-500 selection:text-white flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-[#090E1C]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              MailSense <span className="text-brand-400">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-brand-600/30 transition-all hover:scale-105"
              >
                Go to App
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-medium text-slate-300 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-brand-600/25 transition-all hover:scale-105"
                >
                  Get Started Free
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center flex-1 flex flex-col items-center justify-center">
        {/* Glow backdrop */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-600/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold mb-6 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          Next-Gen AI Email Assistant & Webmail Client
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15] max-w-4xl">
          Supercharge your inbox with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-400 to-teal-300">
            Intelligent AI
          </span>{' '}
          summaries & drafts.
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Connect your real Gmail over secure OAuth. Get executive summaries, extract actionable deadlines, and generate tone-perfect reply drafts in seconds.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-xl shadow-brand-600/30 transition-all hover:scale-105 active:scale-95"
          >
            Launch MailSense AI
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-sm px-6 py-3.5 rounded-xl shadow-lg transition-all"
          >
            Sign In with Demo Account
          </Link>
        </div>

        {/* Live Interactive Preview Box */}
        <div className="mt-14 w-full text-left bg-[#0E1528] border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-slate-400">
                Live Interactive Demonstration
              </span>
            </div>
            <span className="text-[11px] bg-brand-500/20 text-brand-300 px-2.5 py-0.5 rounded-full border border-brand-500/30 font-medium">
              Interactive Preview
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Email + AI Summary */}
            <div className="space-y-4">
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-white">Sarah Jenkins &lt;s.jenkins@cloudops.io&gt;</span>
                  <span>10 mins ago</span>
                </div>
                <h4 className="text-xs font-bold text-slate-200 mb-2">
                  Urgent: Q3 Cloud Infrastructure Migration Review & Sign-Off
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  "We need stakeholder approval by Friday 5 PM EST for the AWS to GCP transition. Database replication test is this Thursday..."
                </p>
              </div>

              {/* AI Summary Card */}
              <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    AI Executive Summary
                  </span>
                  <span className="text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-semibold">
                    High Urgency
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Requesting stakeholder sign-off on the GCP migration plan by Friday at 5:00 PM EST. Rehearsal replication scheduled for Thursday 2:00 AM UTC.
                </p>
                <div className="pt-2 border-t border-indigo-500/20 flex items-center justify-between text-[11px] text-amber-300">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Deadline: Friday 5:00 PM EST
                  </span>
                </div>
              </div>
            </div>

            {/* Right: AI Reply Generator Demo */}
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-brand-400" />
                    Select Response Tone
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {['professional', 'friendly', 'formal', 'concise'].map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setSelectedTone(tone)}
                      className={`text-[11px] capitalize py-1.5 px-2 rounded-lg border font-medium transition-all text-center ${
                        selectedTone === tone
                          ? 'bg-brand-600 text-white border-brand-500 font-bold shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>

                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans min-h-[140px]">
                  {demoResponses[selectedTone]}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <span className="text-[11px] text-slate-500">
                  Always editable before sending
                </span>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  Try in Full App
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 bg-[#0B101D] border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Enterprise-Grade Security & AI Workflows
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Engineered with modern protocols, encrypted OAuth tokens, and multi-tier AI fallback.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Encrypted OAuth at Rest</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero password storage. Gmail access tokens are encrypted with AES-256-GCM and stored exclusively on your server.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Multi-Tier AI Fallback</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seamless chain: OpenRouter &rarr; Google Gemini &rarr; Deterministic Rule Engine so your application always functions even offline.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Human-In-The-Loop</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                AI drafts are placed in standard editable text fields. You always review, customize, and explicitly confirm before any email is sent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#070B14] border-t border-slate-800/80 text-center text-xs text-slate-500">
        <p>MailSense AI — Intelligent Email Assistant. Built with Next.js, Express, Gmail API & AI Engine.</p>
      </footer>
    </div>
  );
}
