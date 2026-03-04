'use client';

import { FileDown, FileText, RotateCcw } from 'lucide-react';
import { useAuditStore } from '../context/AuditStoreContext';
import { exportAuditPdf } from '../utils/exportPdf';
import { exportAuditDocx } from '../utils/exportDocx';

/** Section 24 & 40: Dashboard title and action buttons; no overlap with navbar. */
interface DashboardTitleBarProps {
  onRerunAnalysis: () => void;
}

export default function DashboardTitleBar({ onRerunAnalysis }: DashboardTitleBarProps) {
  const { state } = useAuditStore();
  const hasData = state.store.totalAdSpend > 0 || state.store.totalStoreSales > 0;

  const handlePdf = () => exportAuditPdf(state.store);
  const handleWord = async () => await exportAuditDocx(state.store);

  return (
    <section
      aria-label="Audit dashboard title and actions"
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-6"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text)]">
        Amazon Advertising Performance Audit
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRerunAnalysis}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 font-medium text-sm hover:bg-blue-500/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Rerun analysis"
        >
          <RotateCcw size={18} aria-hidden />
          Rerun Analysis
        </button>
        <button
          type="button"
          onClick={handleWord}
          disabled={!hasData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 font-medium text-sm hover:bg-purple-500/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Download Word"
        >
          <FileText size={18} aria-hidden />
          Download Word
        </button>
        <button
          type="button"
          onClick={handlePdf}
          disabled={!hasData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 font-medium text-sm hover:bg-purple-500/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Download PDF"
        >
          <FileDown size={18} aria-hidden />
          Download PDF
        </button>
      </div>
    </section>
  );
}
