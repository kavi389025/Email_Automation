import React, { useState } from 'react';
import api from '../../services/api';
import { useEmailStore } from '../../store/emailStore';
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  RefreshCw,
  Sliders,
  Cpu,
} from 'lucide-react';

export default function AIReplyPanel({ email, onReplySent }) {
  const { openCompose } = useEmailStore();

  const [tone, setTone] = useState('professional');
  const [instructions, setInstructions] = useState('');
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [generationMeta, setGenerationMeta] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const tones = [
    { id: 'professional', label: 'Professional', desc: 'Clear, polite, and business focused' },
    { id: 'friendly', label: 'Friendly', desc: 'Warm, approachable, and enthusiastic' },
    { id: 'formal', label: 'Formal', desc: 'Diplomatic, structured, and strictly formal' },
    { id: 'concise', label: 'Concise', desc: 'Direct, brief, minimal pleasantries' },
  ];

  const handleGenerate = async () => {
    if (!email) return;
    try {
      setIsGenerating(true);
      setStatusMessage(null);

      const res = await api.post('/ai/generate-reply', {
        emailId: email._id,
        tone,
        userInstructions: instructions,
      });

      if (res.data) {
        setDraftSubject(res.data.subject || `Re: ${email.subject}`);
        setDraftBody(res.data.body || '');
        setGenerationMeta({
          provider: res.data.provider,
          model: res.data.model,
          executionTimeMs: res.data.executionTimeMs,
        });
      }
    } catch (err) {
      console.error('Failed to generate reply:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to generate AI reply draft.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!draftBody.trim()) {
      setStatusMessage({ type: 'error', text: 'Reply draft body is empty.' });
      return;
    }

    try {
      setIsSending(true);
      setStatusMessage(null);

      await api.post('/emails/send', {
        to: email.from?.email || email.from,
        subject: draftSubject || `Re: ${email.subject}`,
        bodyText: draftBody,
        inReplyTo: email.gmailMessageId,
        references: email.gmailMessageId,
        threadId: email.threadId,
      });

      setStatusMessage({ type: 'success', text: 'Reply sent successfully!' });
      setDraftBody('');
      setInstructions('');

      if (onReplySent) {
        onReplySent();
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to send reply. Please check connection.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenInModal = () => {
    openCompose({
      to: email.from?.email || email.from,
      subject: draftSubject || `Re: ${email.subject}`,
      bodyText: draftBody,
      inReplyTo: email.gmailMessageId,
      threadId: email.threadId,
    });
  };

  return (
    <div className="bg-[#0E1528] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Reply Assistant</h3>
            <p className="text-[11px] text-slate-400">
              Draft context-aware replies with customizable tone and instant editing
            </p>
          </div>
        </div>

        {generationMeta && (
          <span className="text-[10px] bg-slate-900 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Cpu className="w-3 h-3 text-indigo-400" />
            {generationMeta.provider} ({generationMeta.executionTimeMs}ms)
          </span>
        )}
      </div>

      {/* Tone selection */}
      <div>
        <label className="text-xs font-semibold text-slate-300 mb-2 block flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-brand-400" />
          Select Tone
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {tones.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTone(t.id)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                tone === t.id
                  ? 'bg-brand-500/15 border-brand-500 text-white shadow-sm ring-1 ring-brand-500/40'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-semibold text-slate-200">{t.label}</div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom instructions */}
      <div>
        <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
          Custom Guidance (Optional)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g., Mention I will be out of office until Monday, or confirm budget approval..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-brand-600/25 transition-all disabled:opacity-50 shrink-0"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {draftBody ? 'Regenerate Draft' : 'Draft Reply'}
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Editable Reply Body Area */}
      {draftBody && (
        <div className="space-y-2 pt-2 border-t border-slate-800 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              Review & Edit AI Draft
              <span className="text-[10px] text-slate-500 font-normal">
                (Click to modify text before sending)
              </span>
            </span>
            <button
              type="button"
              onClick={handleOpenInModal}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Full Screen
            </button>
          </div>

          <textarea
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            rows={7}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500 leading-relaxed resize-none font-sans"
          />

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setDraftBody('')}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Clear Draft
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={isSending}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSending ? 'Sending via Gmail...' : 'Send Reply'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
