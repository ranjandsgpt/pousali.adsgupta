'use client';

import { useLearning } from '../learning/LearningContext';
import { useAuditStore } from '../context/AuditStoreContext';
import { useEffect } from 'react';

/** Learning Intelligence — shows system learning stats and cross-account insights. */
export default function LearningIntelligencePanel() {
  const { learning, crossAccountInsights, refresh } = useLearning();
  const { state } = useAuditStore();
  const hasData = state.store.totalAdSpend > 0 || state.store.totalStoreSales > 0;

  useEffect(() => {
    if (hasData) refresh();
  }, [hasData, refresh]);

  if (!learning) {
    return (
      <section
        aria-labelledby="learning-heading"
        className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-6"
      >
        <h2 id="learning-heading" className="text-sm font-semibold text-[var(--color-text)] mb-3">
          Learning Intelligence
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="learning-heading"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-6"
    >
      <h2 id="learning-heading" className="text-sm font-semibold text-[var(--color-text)] mb-3">
        Learning Intelligence
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="rounded-lg bg-white/5 px-3 py-2">
          <p className="text-xs text-[var(--color-text-muted)]">Accounts analyzed</p>
          <p className="text-lg font-bold text-[var(--color-text)] tabular-nums">
            {learning.accountsAnalyzed}
          </p>
        </div>
        <div className="rounded-lg bg-white/5 px-3 py-2">
          <p className="text-xs text-[var(--color-text-muted)]">Patterns discovered</p>
          <p className="text-lg font-bold text-[var(--color-text)] tabular-nums">
            {learning.patternsDiscovered}
          </p>
        </div>
        <div className="rounded-lg bg-red-500/10 px-3 py-2">
          <p className="text-xs text-red-400/90">Waste patterns detected</p>
          <p className="text-lg font-bold text-red-300 tabular-nums">
            {learning.wastePatternsDetected}
          </p>
        </div>
        <div className="rounded-lg bg-emerald-500/10 px-3 py-2">
          <p className="text-xs text-emerald-400/90">Growth patterns detected</p>
          <p className="text-lg font-bold text-emerald-300 tabular-nums">
            {learning.growthPatternsDetected}
          </p>
        </div>
      </div>
      {learning.accountBenchmarks && learning.accountBenchmarks.sampleCount >= 2 && (
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 mb-4">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Learned benchmarks (anonymized)</p>
          <p className="text-xs text-[var(--color-text)]">
            Avg TACOS {learning.accountBenchmarks.averageTACOS.toFixed(1)}% · Avg CTR{' '}
            {learning.accountBenchmarks.averageCTR.toFixed(2)}% · Avg CVR{' '}
            {learning.accountBenchmarks.averageCVR.toFixed(1)}% · Avg ROAS{' '}
            {learning.accountBenchmarks.averageROAS.toFixed(2)}× (n={learning.accountBenchmarks.sampleCount})
          </p>
        </div>
      )}
      {crossAccountInsights.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
            Cross-account insights (vs learned dataset)
          </p>
          <ul className="space-y-2">
            {crossAccountInsights.map((insight, i) => (
              <li
                key={i}
                className="text-sm text-[var(--color-text)] flex items-start gap-2 rounded-lg bg-purple-500/10 px-3 py-2"
              >
                <span className="shrink-0 text-purple-400 font-mono text-xs">
                  {Math.round(insight.confidence)}%
                </span>
                <span>{insight.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
