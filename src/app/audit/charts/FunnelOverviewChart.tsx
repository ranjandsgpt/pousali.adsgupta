'use client';

import { useAuditStore } from '../context/AuditStoreContext';
import { useMemo } from 'react';
import { formatPercent, formatCurrency } from '../utils/formatNumber';

/** Section 4: Impressions → Click → Order funnel from Campaign Report totals. */
export default function FunnelOverviewChart() {
  const { state } = useAuditStore();
  const store = state.store;
  const imp = store.totalImpressions ?? 0;
  const clk = store.totalClicks > 0 ? store.totalClicks : Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);
  const ord = store.totalOrders ?? 0;
  const rev = store.totalAdSales ?? 0;

  const steps = useMemo(() => {
    const ctr = imp > 0 ? (clk / imp) * 100 : 0;
    const clickToOrder = clk > 0 ? (ord / clk) * 100 : 0;
    const cpc = clk > 0 ? store.totalAdSpend / clk : 0;
    return [
      { label: 'Impressions', value: imp, sub: null, format: 'number' as const },
      { label: 'Clicks', value: clk, sub: imp > 0 ? `CTR ${formatPercent(ctr)}` : null, format: 'number' as const },
      { label: 'Orders', value: ord, sub: clk > 0 ? `CVR ${formatPercent(clickToOrder)}` : null, format: 'number' as const },
      { label: 'Revenue', value: rev, sub: clk > 0 ? `CPC ${formatCurrency(cpc, store.currency)}` : null, format: 'currency' as const },
    ].filter((s) => s.value > 0);
  }, [imp, clk, ord, rev, store.totalAdSpend, store.currency]);

  if (steps.length === 0) {
    return (
      <div className="rounded border border-white/10 bg-white/5 p-4 min-h-[180px] flex items-center justify-center text-[var(--color-text-muted)] text-sm">
        No funnel data. Upload a Campaign Report with Impressions, Clicks, Orders.
      </div>
    );
  }

  const maxVal = Math.max(...steps.map((s) => s.value), 1);
  return (
    <div className="rounded border border-white/10 bg-white/5 p-4 min-h-[180px]">
      <h4 className="text-xs font-semibold text-[var(--color-text)] mb-3">Funnel: Impressions → Click → Order</h4>
      <div className="space-y-2">
        {steps.map((step, i) => {
          const pct = (step.value / maxVal) * 100;
          return (
            <div key={step.label} className="flex items-center gap-3">
              <div className="w-24 text-xs text-[var(--color-text-muted)] shrink-0">{step.label}</div>
              <div className="flex-1 h-6 rounded bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded bg-cyan-500/60 transition-all"
                  style={{ width: `${Math.max(pct, 4)}%` }}
                />
              </div>
              <div className="w-28 text-right text-xs tabular-nums text-[var(--color-text)] shrink-0">
                {step.format === 'currency'
                  ? formatCurrency(step.value, store.currency)
                  : typeof step.value === 'number' && step.value >= 1000
                    ? (step.value / 1000).toFixed(1) + 'k'
                    : step.value.toLocaleString()}
                {step.sub && <span className="block text-[var(--color-text-muted)]">{step.sub}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
