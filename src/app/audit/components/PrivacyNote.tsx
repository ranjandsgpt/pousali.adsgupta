'use client';

import { Shield } from 'lucide-react';

/**
 * Section 21: Security & Privacy – all processing client-side.
 * No data stored, no server uploads, no cookies, no external APIs.
 */
export default function PrivacyNote() {
  return (
    <div
      className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--color-text-muted)]"
      role="status"
      aria-label="Privacy and data processing"
    >
      <Shield size={18} className="shrink-0 mt-0.5 text-cyan-500/80" aria-hidden />
      <p>
        <strong className="text-[var(--color-text)]">Client-side only.</strong> All file processing happens in your browser. No data stored, no server uploads, no cookies, no external APIs. Your data remains private.
      </p>
    </div>
  );
}
