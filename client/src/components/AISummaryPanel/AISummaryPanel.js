import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Flame,
  UserCheck,
  Cpu,
  Clock,
  RefreshCw,
} from 'lucide-react';

export default function AISummaryPanel({
  summaryData,
  isLoading,
  onGenerateReply,
  onRefresh,
}) {
  if (isLoading) {
    return (
      <div className="bg-[#0D1424] border border-brand-500/30 rounded-2xl p-5 mb-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400 animate-spin" />
            <span className="font-semibold text-sm text-white">
              AI Summary Engine Analyzing Email...
            </span>
          </div>
          <div className="w-20 h-5 rounded-full skeleton-shimmer" />
        </div>
        <div className="space-y-3">
          <div className="h-4 rounded-lg skeleton-shimmer w-full" />
          <div className="h-4 rounded-lg skeleton-shimmer w-5/6" />
          <div className="h-4 rounded-lg skeleton-shimmer w-3/4" />
        </div>
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex gap-2">
          <div className="h-7 w-24 rounded-lg skeleton-shimmer" />
          <div className="h-7 w-28 rounded-lg skeleton-shimmer" />
        </div>
      </div>
    );
  }

  if (!summaryData) return null;

  const urgencyColors = {
    High: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    Medium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    Low: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  };

  return (
    <div className="bg-gradient-to-br from-[#0E172A] via-[#0F1930] to-[#111A36] border border-brand-500/30 rounded-2xl p-5 mb-6 shadow-2xl relative overflow-hidden transition-all hover:border-brand-500/50">
      {/* Decorative ambient glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              AI Executive Summary
              <span className="text-[10px] font-normal text-slate-400 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-brand-400" />
                {summaryData.provider || 'AI Engine'}
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {summaryData.urgency && (
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                urgencyColors[summaryData.urgency] || urgencyColors.Medium
              }`}
            >
              <Flame className="w-3 h-3" />
              {summaryData.urgency} Urgency
            </span>
          )}

          {summaryData.senderIntent && (
            <span className="text-xs bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              {summaryData.senderIntent}
            </span>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Regenerate summary"
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Summary Narrative */}
      <div className="text-sm text-slate-200 leading-relaxed mb-4">
        {summaryData.summary}
      </div>

      {/* Key points */}
      {summaryData.keyPoints && summaryData.keyPoints.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Key Highlights
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {summaryData.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                <span className="leading-normal">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items / Deadlines */}
      {summaryData.actionItems && summaryData.actionItems.length > 0 && (
        <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 mb-4">
          <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Action Items & Deadlines
          </h4>
          <div className="space-y-2">
            {summaryData.actionItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-3 text-xs bg-slate-950/60 p-2 rounded-lg border border-slate-800/60"
              >
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 font-mono text-[11px] mt-0.5">
                    {idx + 1}.
                  </span>
                  <span className="text-slate-200">{item.task}</span>
                </div>
                {item.deadline && (
                  <span className="shrink-0 text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1 font-medium">
                    <Calendar className="w-3 h-3" />
                    {item.deadline}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA Footer with visible Generate Reply action */}
      <div className="pt-2 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Generated in {summaryData.executionTimeMs || 120}ms
        </span>

        {onGenerateReply && (
          <button
            onClick={onGenerateReply}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-brand-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate AI Reply
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
