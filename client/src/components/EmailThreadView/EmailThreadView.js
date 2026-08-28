import React, { useState } from 'react';
import AISummaryPanel from '../AISummaryPanel';
import AIReplyPanel from '../AIReplyPanel';
import { useEmailStore } from '../../store/emailStore';
import {
  Star,
  Archive,
  Trash2,
  Reply,
  Forward,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Sparkles,
  ArrowLeft,
  Mail,
} from 'lucide-react';
import Link from 'next/link';

export default function EmailThreadView({
  email,
  threadMessages = [],
  summaryData,
  summaryLoading,
  onRefreshSummary,
  onToggleStar,
  onArchive,
  onTrash,
  onReplySent,
}) {
  const { openCompose } = useEmailStore();
  const [collapsedMessages, setCollapsedMessages] = useState({});
  const replyPanelRef = React.useRef(null);

  const toggleCollapse = (msgId) => {
    setCollapsedMessages((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleScrollToReply = () => {
    if (replyPanelRef.current) {
      replyPanelRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!email) return null;

  const messagesToRender =
    threadMessages.length > 0 ? threadMessages : [email];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top navigation & action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/inbox"
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700/60 transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Inbox
          </Link>

          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate max-w-md">
            {email.subject}
          </h2>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onToggleStar && onToggleStar(email._id, !email.isStarred)}
            title={email.isStarred ? 'Unstar' : 'Star'}
            className="p-2 text-slate-400 hover:text-amber-400 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/60 transition-colors"
          >
            <Star
              className={`w-4 h-4 ${
                email.isStarred ? 'fill-amber-400 text-amber-400' : ''
              }`}
            />
          </button>
          <button
            onClick={() => onArchive && onArchive(email._id)}
            title="Archive email"
            className="p-2 text-slate-400 hover:text-amber-400 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/60 transition-colors"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={() => onTrash && onTrash(email._id)}
            title="Move to trash"
            className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/60 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              openCompose({
                to: email.from?.email,
                subject: `Fwd: ${email.subject}`,
                bodyText: `\n\n---------- Forwarded message ---------\nFrom: ${email.from?.name} <${email.from?.email}>\nSubject: ${email.subject}\n\n${email.bodyText || email.snippet}`,
              })
            }
            title="Forward"
            className="p-2 text-slate-400 hover:text-brand-400 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/60 transition-colors"
          >
            <Forward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Surface AI Summary Panel right above the messages */}
      <AISummaryPanel
        summaryData={summaryData}
        isLoading={summaryLoading}
        onGenerateReply={handleScrollToReply}
        onRefresh={onRefreshSummary}
      />

      {/* Messages Thread Stack */}
      <div className="space-y-4">
        {messagesToRender.map((msg, index) => {
          const isLastMessage = index === messagesToRender.length - 1;
          const isCollapsed = Boolean(collapsedMessages[msg._id]);

          return (
            <div
              key={msg._id || index}
              className={`bg-[#0D1322] border rounded-2xl transition-all ${
                isLastMessage
                  ? 'border-slate-700/80 shadow-lg'
                  : 'border-slate-800/80 opacity-90'
              }`}
            >
              {/* Message Header */}
              <div
                onClick={() => !isLastMessage && toggleCollapse(msg._id)}
                className={`p-4 sm:p-5 flex items-center justify-between gap-3 ${
                  !isLastMessage ? 'cursor-pointer hover:bg-slate-800/30' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs uppercase shrink-0">
                    {(msg.from?.name || msg.from?.email || 'U').charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white truncate">
                        {msg.from?.name || msg.from?.email}
                      </span>
                      <span className="text-xs text-slate-500 truncate hidden sm:inline">
                        &lt;{msg.from?.email}&gt;
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      To: {(msg.to || []).map((t) => t.name || t.email).join(', ') || 'Me'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(msg.receivedAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {!isLastMessage && (
                    <button className="text-slate-500 hover:text-slate-300">
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Message Body (Expandable) */}
              {!isCollapsed && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-800/60">
                  {msg.bodyHtml ? (
                    <div
                      className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-200 leading-relaxed overflow-x-auto pt-3"
                      dangerouslySetInnerHTML={{ __html: msg.bodyHtml }}
                    />
                  ) : (
                    <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans pt-3">
                      {msg.bodyText || msg.snippet}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Reply Drafting Panel at the bottom */}
      <div ref={replyPanelRef} className="pt-2">
        <AIReplyPanel email={email} onReplySent={onReplySent} />
      </div>
    </div>
  );
}
