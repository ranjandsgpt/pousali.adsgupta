'use client';

import { FileDown, Presentation, RefreshCw } from 'lucide-react';
import { useAuditStore } from '../context/AuditStoreContext';

/** Bottom export bar: PDF, PPTX, Refresh. Zenith CXO Export. */
interface ExportBarProps {
  onDownloadPdf?: () => void;
  onDownloadPptx?: () => void;
  onRefreshExports?: () => void;
  exportGenerating?: boolean;
}

export default function ExportBar({
  onDownloadPdf,
  onDownloadPptx,
  onRefreshExports,
  exportGenerating = false,
}: ExportBarProps) {
  const { state } = useAuditStore();
  const hasData = state.store.totalAdSpend > 0 || state.store.totalStoreSales > 0;
  const lock = exportGenerating;

  return (
    <section
      aria-label="Export report"
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] px-4 py-3"
    >
      <span className="text-sm font-medium text-[var(--color-text)]">
        {lock ? 'Generating premium report…' : 'Export Report (PDF & PPTX)'}
      </span>
      <div className="flex items-center gap-2">
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
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 ${lock ? 'opacity-40 pointer-events-none' : ''} bg-cyan-500/20 text-cyan-500 hover:bg-cyan-500/30`}
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
