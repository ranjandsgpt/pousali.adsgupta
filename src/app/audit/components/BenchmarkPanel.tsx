'use client';

import { useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { runBenchmarkAgent } from '@/agents/benchmarkAgent';

export default function BenchmarkPanel() {
  const { state } = useAuditStore();
  const store = state.store;
  const m = store.storeMetrics;
  const totalClicks = store.totalClicks || Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);
  const hasData = store.totalAdSpend > 0 || (store.totalStoreSales ?? 0) > 0;

  const results = useMemo(() => {
    if (!hasData) return [];
    const adSales = store.totalAdSales || 0;
    const adSpend = store.totalAdSpend || 0;
    const acos = adSales > 0 ? (adSpend / adSales) * 100 : 0;
    const ctr = store.totalImpressions > 0 && totalClicks > 0 ? (totalClicks / store.totalImpressions) * 100 : 0;
    const cvr = totalClicks > 0 && (store.totalOrders ?? 0) > 0 ? ((store.totalOrders ?? 0) / totalClicks) * 100 : (m?.cvr ?? 0);
    return runBenchmarkAgent({
      roas: m?.roas ?? 0,
      acos,
      ctr,
      cvr,
      cpc: totalClicks > 0 ? adSpend / totalClicks : 0,
    });
  }, [hasData, m, store.totalAdSpend, store.totalAdSales, store.totalImpressions, store.totalOrders, totalClicks]);

  if (results.length === 0) return null;

  const statusColor = (p: string) =>
    p === 'above' ? 'text-emerald-400' : p === 'below' ? 'text-amber-400' : 'text-[var(--color-text-muted)]';

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Industry benchmark</h3>
      <p className="text-xs text-[var(--color-text-muted)] mb-3">
        Your metrics vs typical agency performance.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {results.map((r) => (
          <div
            key={r.metric}
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs"
          >
            <div className="font-medium text-[var(--color-text)]">{r.metric}</div>
            <div className="mt-0.5 text-[var(--color-text-muted)]">
              Yours: {typeof r.yourValue === 'number' && r.yourValue % 1 !== 0 ? r.yourValue.toFixed(2) : r.yourValue} {r.unit}
              {r.unit === '%' && r.metric !== 'ACOS' ? '' : r.unit === 'x' ? '' : ''}
            </div>
            <div className={`mt-0.5 ${statusColor(r.performance)}`}>{r.message}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
