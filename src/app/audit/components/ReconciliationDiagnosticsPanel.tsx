'use client';

import { useAuditStore } from '../context/AuditStoreContext';
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '../utils/formatNumber';

const SOURCE_LABEL: Record<string, string> = {
  advertisedProductReport: 'Advertised Product',
  targetingReport: 'Targeting',
  campaignReport: 'Campaign',
  searchTermReport: 'Search Term',
  business: 'Business',
};

export default function ReconciliationDiagnosticsPanel() {
  const { state } = useAuditStore();
  const [open, setOpen] = useState(false);
  const reconciliation = state.reconciliation;
  if (!reconciliation) return null;

  const { status, recommendedSource, issues, diagnostics } = reconciliation;
  const hasIssues = issues.length > 0;
  const statusIcon =
    status === 'error' ? (
      <AlertTriangle className="w-4 h-4 text-amber-500" />
    ) : status === 'warning' ? (
      <Info className="w-4 h-4 text-amber-400" />
    ) : (
      <CheckCircle className="w-4 h-4 text-emerald-500" />
    );
  const statusColor =
    status === 'error' ? 'text-amber-600' : status === 'warning' ? 'text-amber-500' : 'text-emerald-600';

  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-[var(--color-surface-hover)] transition-colors"
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
        )}
        <span className="font-medium">Metric reconciliation</span>
        {statusIcon}
        <span className={`text-sm ${statusColor}`}>{status}</span>
        {recommendedSource && (
          <span className="text-sm text-[var(--color-text-muted)]">
            Source: {SOURCE_LABEL[recommendedSource] ?? recommendedSource}
          </span>
        )}
        {hasIssues && (
          <span className="text-xs text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">
            {issues.length} issue{issues.length !== 1 ? 's' : ''}
          </span>
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-[var(--color-border)] space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
            {Object.entries(diagnostics.rowCounts).map(([key, count]) => (
              <div key={key} className="bg-[var(--color-surface)] rounded px-3 py-2">
                <div className="text-[var(--color-text-muted)] truncate">
                  {SOURCE_LABEL[key] ?? key}
                </div>
                <div className="font-mono font-medium">{Number(count)} rows</div>
              </div>
            ))}
          </div>
          {Object.keys(diagnostics.perReportTotals).length > 0 && (
            <div>
              <div className="text-xs font-medium text-[var(--color-text-muted)] mb-1">
                Per-report totals
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                {Object.entries(diagnostics.perReportTotals).map(([key, totals]) => (
                  <div
                    key={key}
                    className="bg-[var(--color-surface)] rounded px-3 py-2 font-mono text-xs"
                  >
                    <div className="font-medium text-[var(--color-text)] mb-1">
                      {SOURCE_LABEL[key] ?? key}
                    </div>
                    <div className="text-[var(--color-text-muted)]">
                      spend {formatCurrency(totals.spend, state.store.currency)} · sales{' '}
                      {formatCurrency(totals.sales, state.store.currency)} · clicks {totals.clicks}{' '}
                      · impr. {totals.impressions} · orders {totals.orders}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {hasIssues && (
            <div>
              <div className="text-xs font-medium text-[var(--color-text-muted)] mb-1">Issues</div>
              <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-400 space-y-1">
                {issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
