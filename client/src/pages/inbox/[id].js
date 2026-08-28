import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AppShell from '../../components/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import EmailThreadView from '../../components/EmailThreadView';
import api from '../../services/api';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EmailDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [email, setEmail] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEmailAndThread = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch single email
      const emailRes = await api.get(`/emails/${id}`);
      const emailData = emailRes.data;
      setEmail(emailData);

      // Mark as read automatically
      if (!emailData.isRead) {
        api.patch(`/emails/${id}`, { isRead: true }).catch((e) => console.error(e));
      }

      // Fetch thread messages if threadId exists
      if (emailData.threadId) {
        try {
          const threadRes = await api.get(`/emails/thread/${emailData.threadId}`);
          if (threadRes.data && Array.isArray(threadRes.data)) {
            setThreadMessages(threadRes.data);
          }
        } catch (threadErr) {
          // If thread endpoint fails, fallback to single message
          setThreadMessages([emailData]);
        }
      } else {
        setThreadMessages([emailData]);
      }

      // Trigger AI summary
      triggerSummary(emailData._id, emailData.threadId);
    } catch (err) {
      console.error('Failed to load email:', err);
      setError(err.message || 'Failed to load email.');
    } finally {
      setLoading(false);
    }
  };

  const triggerSummary = async (emailId, threadId) => {
    try {
      setSummaryLoading(true);
      const res = await api.post('/ai/summarize', {
        emailId,
        threadId,
      });
      if (res.data) {
        setSummaryData(res.data);
      }
    } catch (err) {
      console.error('AI summary failed:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEmailAndThread();
    }
  }, [id]);

  const handleToggleStar = async (emailId, isStarred) => {
    try {
      await api.patch(`/emails/${emailId}`, { isStarred });
      setEmail((prev) => (prev ? { ...prev, isStarred } : prev));
      setThreadMessages((prev) =>
        prev.map((m) => (m._id === emailId ? { ...m, isStarred } : m))
      );
    } catch (err) {
      console.error('Toggle star failed:', err);
    }
  };

  const handleArchive = async (emailId) => {
    try {
      await api.patch(`/emails/${emailId}`, { isArchived: true });
      router.push('/inbox');
    } catch (err) {
      console.error('Archive failed:', err);
    }
  };

  const handleTrash = async (emailId) => {
    try {
      await api.delete(`/emails/${emailId}`);
      router.push('/inbox');
    } catch (err) {
      console.error('Trash failed:', err);
    }
  };

  const handleReplySent = () => {
    // Refresh thread after reply is sent
    fetchEmailAndThread();
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex-1 overflow-y-auto bg-[#090D16]">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
              <p className="text-xs tracking-wider animate-pulse">Loading email thread...</p>
            </div>
          ) : error ? (
            <div className="max-w-md mx-auto my-20 p-6 bg-rose-950/40 border border-rose-500/30 rounded-2xl text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
              <h3 className="font-bold text-sm text-white">Failed to load email</h3>
              <p className="text-xs text-rose-300">{error}</p>
              <Link
                href="/inbox"
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Inbox
              </Link>
            </div>
          ) : (
            <EmailThreadView
              email={email}
              threadMessages={threadMessages}
              summaryData={summaryData}
              summaryLoading={summaryLoading}
              onRefreshSummary={() => triggerSummary(email._id, email.threadId)}
              onToggleStar={handleToggleStar}
              onArchive={handleArchive}
              onTrash={handleTrash}
              onReplySent={handleReplySent}
            />
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
