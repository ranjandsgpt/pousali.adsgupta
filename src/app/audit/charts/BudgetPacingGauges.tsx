'use client';

import { useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { formatCurrency } from '../utils/formatNumber';

export default function BudgetPacingGauges() {
  const { state } = useAuditStore();
  const top5 = useMemo(() => {
    return Object.values(state.store.campaignMetrics)
      .filter((m) => m.campaignName)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5);
  }, [state.store.campaignMetrics]);

  const currency = state.store.currency;

  if (top5.length === 0) {
    return (
      <div className="h-[200px] rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
        No campaign budget data
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Budget Pacing (Top 5 Campaigns)</h3>
      <div className="space-y-4">
        {top5.map((m, i) => {
          const pct = m.budget > 0 ? Math.min(100, (m.spend / m.budget) * 100) : 0;
          return (
            <div key={i}>
              <div className="flex justify-between text-xs text-[var(--color-text-muted)] mb-1">
                <span className="truncate max-w-[140px]" title={m.campaignName}>
                  {m.campaignName}
                </span>
                <span>
                  {currency ? formatCurrency(m.spend, currency) : m.spend.toFixed(0)} /{' '}
                  {m.budget > 0 ? (currency ? formatCurrency(m.budget, currency) : m.budget.toFixed(0)) : '—'}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
