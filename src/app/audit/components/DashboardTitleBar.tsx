'use client';

import { FileDown, Presentation, RotateCcw, RefreshCw } from 'lucide-react';
import { useAuditStore } from '../context/AuditStoreContext';

/** Dashboard title and actions: Rerun, Refresh exports, Download PDF, Download PPTX. */
interface DashboardTitleBarProps {
  onRerunAnalysis: () => void;
  onDownloadPdf?: () => void;
  onDownloadPptx?: () => void;
  onRefreshExports?: () => void;
  exportGenerating?: boolean;
}

export default function DashboardTitleBar({
  onRerunAnalysis,
  onDownloadPdf,
  onDownloadPptx,
  onRefreshExports,
  exportGenerating = false,
}: DashboardTitleBarProps) {
  const { state } = useAuditStore();
  const hasData = state.store.totalAdSpend > 0 || state.store.totalStoreSales > 0;
  const lock = exportGenerating;

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
        {onRefreshExports && (
          <button
            type="button"
            onClick={onRefreshExports}
            disabled={!hasData || lock}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-500/20 text-slate-300 font-medium text-sm hover:bg-slate-500/30 disabled:opacity-50"
            aria-label="Refresh exports"
            title="Regenerate premium report"
          >
            <RefreshCw size={18} className={lock ? 'animate-spin' : ''} aria-hidden />
            Refresh
          </button>
        )}
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={!hasData || lock}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 ${lock ? 'opacity-40 pointer-events-none' : ''} bg-purple-500/20 text-purple-400 hover:bg-purple-500/30`}
          style={lock ? { filter: 'blur(4px)' } : undefined}
          aria-label="Download PDF"
        >
          <FileDown size={18} aria-hidden />
          Download PDF
        </button>
        <button
          type="button"
          onClick={onDownloadPptx}
          disabled={!hasData || lock}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 ${lock ? 'opacity-40 pointer-events-none' : ''} bg-amber-500/20 text-amber-400 hover:bg-amber-500/30`}
          style={lock ? { filter: 'blur(4px)' } : undefined}
          aria-label="Download PPTX"
        >
          <Presentation size={18} aria-hidden />
          Download PPTX
        </button>
      </div>
    </section>
  );
}
