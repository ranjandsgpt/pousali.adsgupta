'use client';

import { FileDown, FileText } from 'lucide-react';
import { useAuditStore } from '../context/AuditStoreContext';
import { exportAuditPdf } from '../utils/exportPdf';
import { exportAuditDocx } from '../utils/exportDocx';

/** Section 9: PDF & Word export – white-label, client-side only. */
export default function ExportBar() {
  const { state } = useAuditStore();
  const hasData = state.store.totalAdSpend > 0 || state.store.totalStoreSales > 0;

  const handlePdf = () => {
    exportAuditPdf(state.store);
  };

  const handleWord = async () => {
    await exportAuditDocx(state.store);
  };

  return (
    <section
      aria-label="Export report"
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] px-4 py-3"
    >
      <span className="text-sm font-medium text-[var(--color-text)]">
        Export Report (PDF & Word)
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePdf}
          disabled={!hasData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-500 font-medium text-sm hover:bg-cyan-500/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Export as PDF"
        >
          <FileDown size={18} aria-hidden />
          PDF
        </button>
        <button
          type="button"
          onClick={handleWord}
          disabled={!hasData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-500 font-medium text-sm hover:bg-cyan-500/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Export as Word"
        >
          <FileText size={18} aria-hidden />
          Word
        </button>
      </div>
    </section>
  );
}
