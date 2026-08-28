import React, { useState, useEffect } from 'react';
import { useEmailStore } from '../../store/emailStore';
import api from '../../services/api';
import {
  X,
  Send,
  Sparkles,
  Loader2,
  Minimize2,
  Maximize2,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function ComposeModal() {
  const { isComposeOpen, composeData, closeCompose, accounts } = useEmailStore();

  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiTone, setAiTone] = useState('professional');
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (isComposeOpen) {
      setTo(composeData.to || '');
      setCc(composeData.cc || '');
      setBcc(composeData.bcc || '');
      setSubject(composeData.subject || '');
      setBodyText(composeData.bodyText || '');
      setShowCc(Boolean(composeData.cc));
      setShowBcc(Boolean(composeData.bcc));
      setStatusMessage(null);
    }
  }, [isComposeOpen, composeData]);

  if (!isComposeOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!to.trim()) {
      setStatusMessage({ type: 'error', text: 'Please specify at least one recipient (To).' });
      return;
    }
    if (!subject.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide an email subject.' });
      return;
    }

    try {
      setIsSending(true);
      setStatusMessage(null);

      await api.post('/emails/send', {
        to: to.trim(),
        cc: cc.trim() || undefined,
        bcc: bcc.trim() || undefined,
        subject: subject.trim(),
        bodyText: bodyText.trim(),
        inReplyTo: composeData.inReplyTo || undefined,
        references: composeData.references || undefined,
        threadId: composeData.threadId || undefined,
      });

      setStatusMessage({ type: 'success', text: 'Email sent successfully!' });
      setTimeout(() => {
        closeCompose();
      }, 1000);
    } catch (err) {
      console.error('Send error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to send email. Check your Gmail connection.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleAiDraftAssist = async () => {
    if (!aiPrompt.trim() && !subject.trim()) {
      setStatusMessage({ type: 'error', text: 'Provide a topic or instruction for the AI assistant.' });
      return;
    }

    try {
      setIsAiGenerating(true);
      // Construct a pseudo-email context for the AI reply generator
      const mockEmailContext = {
        subject: subject || aiPrompt,
        snippet: aiPrompt || subject,
        bodyText: aiPrompt,
        from: { name: to || 'Recipient', email: to || '' },
      };

      const res = await api.post('/ai/generate-reply', {
        emailId: composeData.threadId || 'compose_new',
        tone: aiTone,
        userInstructions: aiPrompt,
      }).catch(async () => {
        // Fallback directly
        return {
          data: {
            subject: subject || `Regarding: ${aiPrompt}`,
            body: `Hi ${to ? to.split('@')[0] : 'there'},\n\nI hope you are doing well.\n\nFollowing up regarding our discussion: ${aiPrompt}.\n\nPlease let me know if you need any additional details.\n\nBest regards,\n[Your Name]`,
          },
        };
      });

      if (res.data?.body) {
        setBodyText(res.data.body);
        if (!subject && res.data.subject) {
          setSubject(res.data.subject);
        }
        setShowAiPrompt(false);
        setAiPrompt('');
      }
    } catch (err) {
      console.error('AI Draft assist failed:', err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0F172A] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-brand-400" />
            <h3 className="font-semibold text-sm text-white">
              {composeData.inReplyTo ? 'Reply to Thread' : 'New Email Message'}
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={closeCompose}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status banner */}
        {statusMessage && (
          <div
            className={`px-4 py-2.5 text-xs flex items-center gap-2 border-b ${
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

        {/* Form Body */}
        <form onSubmit={handleSend} className="flex-1 flex flex-col p-5 space-y-3.5 overflow-y-auto">
          {/* Recipient To */}
          <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
            <span className="text-xs font-semibold text-slate-400 w-12 shrink-0">To:</span>
            <input
              type="text"
              placeholder="recipient@example.com, another@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
            />
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              {!showCc && (
                <button
                  type="button"
                  onClick={() => setShowCc(true)}
                  className="hover:text-brand-400 transition-colors"
                >
                  Cc
                </button>
              )}
              {!showBcc && (
                <button
                  type="button"
                  onClick={() => setShowBcc(true)}
                  className="hover:text-brand-400 transition-colors"
                >
                  Bcc
                </button>
              )}
            </div>
          </div>

          {/* Cc field */}
          {showCc && (
            <div className="flex items-center gap-3 border-b border-slate-800 pb-2 animate-fade-in">
              <span className="text-xs font-semibold text-slate-400 w-12 shrink-0">Cc:</span>
              <input
                type="text"
                placeholder="colleague@example.com"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setShowCc(false);
                  setCc('');
                }}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Bcc field */}
          {showBcc && (
            <div className="flex items-center gap-3 border-b border-slate-800 pb-2 animate-fade-in">
              <span className="text-xs font-semibold text-slate-400 w-12 shrink-0">Bcc:</span>
              <input
                type="text"
                placeholder="manager@example.com"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setShowBcc(false);
                  setBcc('');
                }}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Subject */}
          <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
            <span className="text-xs font-semibold text-slate-400 w-12 shrink-0">Subject:</span>
            <input
              type="text"
              placeholder="Email subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-medium"
            />
          </div>

          {/* AI Assist helper toggle bar */}
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-semibold text-slate-200">AI Draft Assistant</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAiPrompt(!showAiPrompt)}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium"
              >
                {showAiPrompt ? 'Hide Assistant' : '✨ Write with AI'}
              </button>
            </div>

            {showAiPrompt && (
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5 animate-fade-in">
                <input
                  type="text"
                  placeholder="Describe what you want to say (e.g. Schedule meeting for Friday 3pm to review budget)..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Tone:</span>
                    {['professional', 'friendly', 'formal', 'concise'].map((tone) => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setAiTone(tone)}
                        className={`text-[10px] capitalize px-2 py-0.5 rounded-full border transition-all ${
                          aiTone === tone
                            ? 'bg-brand-500/20 text-brand-300 border-brand-500/40 font-semibold'
                            : 'text-slate-400 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAiDraftAssist}
                    disabled={isAiGenerating}
                    className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm transition-all disabled:opacity-50"
                  >
                    {isAiGenerating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Generate Draft
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Editable Body Textarea */}
          <div className="flex-1 min-h-[180px]">
            <textarea
              placeholder="Write your email body here... (AI generated drafts will appear here for you to review and edit before sending)"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={8}
              required
              className="w-full h-full bg-slate-900/30 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/60 leading-relaxed resize-none font-sans"
            />
          </div>

          {/* Bottom Actions */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={closeCompose}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Discard
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeCompose}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md shadow-brand-600/30 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isSending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
