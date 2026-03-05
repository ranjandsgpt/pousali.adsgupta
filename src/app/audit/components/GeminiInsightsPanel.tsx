'use client';

import { useState } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { useGeminiReport } from '../context/GeminiReportContext';
import { exportAmazonPerformancePptx, exportAgencyActionPlanCsv } from '../utils/exportGeminiReport';

export default function GeminiInsightsPanel() {
  const { state } = useAuditStore();
  const { report, loading, error } = useGeminiReport();
  const store = state.store;
  const hasData = store.totalAdSpend > 0 || store.totalStoreSales > 0;
  const [exportingPptx, setExportingPptx] = useState(false);

  if (!hasData) return null;

  const handleExportPptx = async () => {
    setExportingPptx(true);
    try {
      await exportAmazonPerformancePptx(store);
    } finally {
      setExportingPptx(false);
    }
  };

  const handleExportCsv = () => {
    exportAgencyActionPlanCsv(store);
  };

  return (
    <section
      aria-labelledby="gemini-insights-heading"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-6 space-y-4"
    >
      <header className="space-y-1">
        <h2
          id="gemini-insights-heading"
          className="text-lg font-semibold text-[var(--color-text)]"
        >
          AI Audit Narrative — Gemini
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Executive audit report generated from your normalized Amazon Advertising data.
        </p>
      </header>

      {loading && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-6 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            Gemini is analyzing your Amazon advertising account…
          </p>
        </div>
      )}

      {error && !loading && (
        <div
          className="rounded-lg bg-red-500/10 border border-red-500/20 p-3"
          role="alert"
        >
          <p className="text-sm font-medium text-red-400">{error}</p>
        </div>
      )}

      {!loading && hasData && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportPptx}
            disabled={exportingPptx}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50 text-sm font-medium"
          >
            {exportingPptx ? 'Generating…' : 'Download Amazon_Performance_Report.pptx'}
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-sm font-medium"
          >
            Download Agency_Action_Plan.csv
          </button>
        </div>
      )}

      {report && !loading && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="text-sm text-[var(--color-text)] whitespace-pre-wrap font-[inherit] leading-relaxed gemini-report-content">
            {report}
          </div>
        </div>
      )}
    </section>
  );
}
