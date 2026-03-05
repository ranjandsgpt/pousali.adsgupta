'use client';

import { useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';

const CANDIDATES: Array<{ key: string; label: string; detect: (store: import('../utils/reportParser').MemoryStore) => boolean }> = [
  { key: 'sessions', label: 'Sessions', detect: (s) => s.totalSessions <= 0 && Object.values(s.asinMetrics).every((a) => !a.sessions) },
  { key: 'buybox', label: 'Buy Box %', detect: (s) => (s.buyBoxPercent ?? 0) <= 0 && Object.values(s.asinMetrics).every((a) => a.buyBoxPercent == null || a.buyBoxPercent <= 0) },
  { key: 'profitMargin', label: 'Profit Margin', detect: (s) => (s.storeMetrics.contributionMargin === 0 && s.storeMetrics.breakEvenAcos === 0) },
  { key: 'inventory', label: 'Inventory Levels', detect: () => true },
];

/** Missing metrics: show as warning chips and explanation. */
export default function MissingMetricsPanel() {
  const { state } = useAuditStore();
  const missing = useMemo(
    () => CANDIDATES.filter((c) => c.detect(state.store)).map((c) => c.label),
    [state.store]
  );

  if (missing.length === 0) return null;

  return (
    <section
      aria-labelledby="missing-metrics-heading"
      className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-6"
    >
      <h2 id="missing-metrics-heading" className="text-sm font-semibold text-[var(--color-text)] mb-3">
        3. Missing for full analysis
      </h2>
      <div className="flex flex-wrap gap-2 mb-3">
        {missing.map((label) => (
          <span
            key={label}
            className="inline-flex px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium border border-amber-500/40"
          >
            {label}
          </span>
        ))}
      </div>
      <p className="text-sm text-[var(--color-text-muted)]">
        Upload Business Report (and product cost data where applicable) to unlock these insights.
      </p>
    </section>
  );
}
