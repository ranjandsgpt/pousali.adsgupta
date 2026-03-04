'use client';

import { FileDown } from 'lucide-react';

export default function ExportBar() {
  return (
    <section
      aria-label="Export report"
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] px-4 py-3"
    >
      <span className="text-sm font-medium text-[var(--color-text)]">
        6. Export Report
      </span>
      <button
        type="button"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-500 font-medium text-sm hover:bg-cyan-500/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50"
        disabled
        aria-label="Export report (PDF/DOCX — plug in jsPDF/docx)"
      >
        <FileDown size={18} aria-hidden />
        Export (PDF / DOCX)
      </button>
    </section>
  );
}
