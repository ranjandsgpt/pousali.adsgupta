'use client';

import { Shield } from 'lucide-react';

export default function PrivacyNote() {
  return (
    <div
      className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--color-text-muted)]"
      role="status"
      aria-label="Privacy and data processing"
    >
      <Shield size={18} className="shrink-0 mt-0.5 text-cyan-500/80" aria-hidden />
      <p>
        Your files are processed in your browser and never uploaded to any server. When AI is used, only aggregated metrics and structure are sent; data is sanitized (e.g. emails and phone numbers redacted) before use. Metric calculations are fully deterministic and run locally. If any AI-generated insight looks incorrect, please{' '}
        <a
          href="https://pousali.adsgupta.com/audit-feedback"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-cyan-400 hover:text-cyan-300"
        >
          submit feedback
        </a>
        .
      </p>
    </div>
  );
}
