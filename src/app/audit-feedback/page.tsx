'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * Phase 14 — Central Feedback Panel.
 * Submit feedback: reportId, section, like/dislike, comment.
 */
export default function AuditFeedbackPage() {
  const [reportId, setReportId] = useState('session');
  const [section, setSection] = useState('metrics');
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (feedback === null) return;
    try {
      await fetch('/api/audit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metricId: `feedback-${section}`,
          userFeedback: feedback === 'like' ? 'correct' : 'incorrect',
          artifactType: section,
          comment: comment || undefined,
          audit_id: reportId,
        }),
      });
      setSent(true);
    } catch {
      setSent(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] p-8">
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-xl font-semibold">Audit Feedback</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Submit feedback about the audit. Stored with reportId, section, and timestamp.
        </p>
        {!sent ? (
          <>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Report / Session ID</label>
              <input
                type="text"
                value={reportId}
                onChange={(e) => setReportId(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Affected section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm"
              >
                <option value="metrics">Metrics</option>
                <option value="tables">Tables</option>
                <option value="charts">Charts</option>
                <option value="insights">Insights</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Feedback</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFeedback('like')}
                  className={`px-4 py-2 rounded-lg border text-sm ${feedback === 'like' ? 'bg-emerald-500/30 border-emerald-500/50' : 'border-white/20'}`}
                >
                  Like
                </button>
                <button
                  type="button"
                  onClick={() => setFeedback('dislike')}
                  className={`px-4 py-2 rounded-lg border text-sm ${feedback === 'dislike' ? 'bg-red-500/30 border-red-500/50' : 'border-white/20'}`}
                >
                  Dislike
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Comment (optional)</label>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Optional comment"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={feedback === null}
              className="w-full rounded-lg bg-cyan-500/20 text-cyan-400 px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Submit feedback
            </button>
          </>
        ) : (
          <p className="text-sm text-emerald-400">Thank you. Feedback submitted.</p>
        )}
        <Link href="/audit" className="inline-block text-sm text-cyan-400 hover:underline">
          ← Back to Audit
        </Link>
      </div>
    </div>
  );
}
