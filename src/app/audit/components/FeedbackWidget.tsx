'use client';

import { useState, useCallback } from 'react';

const SECTIONS = [
  { value: 'overview', label: 'Overview' },
  { value: 'keywords', label: 'Keywords & Search Terms' },
  { value: 'campaigns', label: 'Campaigns & Budget' },
  { value: 'asins', label: 'ASINs & Products' },
  { value: 'waste', label: 'Waste & Bleed' },
  { value: 'copilot', label: 'Copilot / Insights' },
  { value: 'export', label: 'Export (PDF/PPTX)' },
  { value: 'general', label: 'General' },
];

const TYPES = [
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature request' },
  { value: 'other', label: 'Other' },
];

const MAX_DESCRIPTION = 500;

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState('general');
  const [type, setType] = useState<'bug' | 'feature' | 'other'>('other');
  const [description, setDescription] = useState('');
  const [includeSession, setIncludeSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [thankYou, setThankYou] = useState(false);

  const submit = useCallback(async () => {
    setSubmitting(true);
    try {
      let sessionId: string | undefined;
      if (includeSession && typeof window !== 'undefined') {
        sessionId = window.sessionStorage.getItem('audit_session_id') ?? undefined;
      }
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          section,
          type,
          description: description.slice(0, MAX_DESCRIPTION),
          includeSession,
          pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
      });
      setThankYou(true);
      setTimeout(() => {
        setThankYou(false);
        setOpen(false);
        setDescription('');
      }, 2000);
    } finally {
      setSubmitting(false);
    }
  }, [section, type, description, includeSession]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-lg text-[var(--color-text)] hover:bg-white/10 transition-colors"
        aria-label="Send feedback"
      >
        <span className="text-lg">💬</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 id="feedback-title" className="text-lg font-semibold text-[var(--color-text)] mb-4">
              Feedback
            </h2>
            {thankYou ? (
              <p className="text-[var(--color-text)] py-8 text-center">Thank you!</p>
            ) : (
              <>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Section</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text)] px-3 py-2 mb-3"
                >
                  {SECTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>

                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Type</label>
                <div className="flex gap-4 mb-3">
                  {TYPES.map((t) => (
                    <label key={t.value} className="flex items-center gap-2 text-sm text-[var(--color-text)]">
                      <input
                        type="radio"
                        name="feedback-type"
                        value={t.value}
                        checked={type === t.value}
                        onChange={() => setType(t.value as 'bug' | 'feature' | 'other')}
                        className="rounded-full"
                      />
                      {t.label}
                    </label>
                  ))}
                </div>

                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Description (max {MAX_DESCRIPTION} characters)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
                  maxLength={MAX_DESCRIPTION}
                  rows={3}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text)] px-3 py-2 mb-2 resize-none"
                  placeholder="Optional details..."
                />
                <p className="text-xs text-[var(--color-text-muted)] mb-3">{description.length}/{MAX_DESCRIPTION}</p>

                <label className="flex items-center gap-2 text-sm text-[var(--color-text)] mb-4">
                  <input
                    type="checkbox"
                    checked={includeSession}
                    onChange={(e) => setIncludeSession(e.target.checked)}
                  />
                  Attach current session?
                </label>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50"
                  >
                    {submitting ? 'Sending…' : 'Submit'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
