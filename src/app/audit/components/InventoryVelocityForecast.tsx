'use client';

import { useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { formatCurrency } from '../utils/formatNumber';

/** Section 31: velocity = units/days, monthly forecast = velocity * 30. */
export default function InventoryVelocityForecast() {
  const { state } = useAuditStore();
  const { store } = state;

  const metrics = useMemo(() => {
    const totalSessions = Object.values(store.asinMetrics).reduce((s, m) => s + m.sessions, 0);
    const days = 30;
    const salesVelocity = store.totalStoreSales > 0 ? store.totalStoreSales / days : 0;
    const projectedMonthly = salesVelocity * 30;
    // Session growth rate requires period-over-period data (e.g. prior week vs current).
    // Store does not expose time-series sessions; show null so UI displays "—".
    return {
      dailySalesVelocity: salesVelocity,
      projectedMonthlySales: projectedMonthly,
      inventoryDepletionDays: null as number | null,
      sessionGrowthRate: null as number | null,
    };
  }, [store]);

  return (
    <section
      aria-labelledby="inventory-velocity-heading"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-6"
    >
      <h2 id="inventory-velocity-heading" className="text-sm font-semibold text-[var(--color-text)] mb-3">
        Inventory Velocity Forecast
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3">
          <p className="text-xs font-medium text-sky-400/90 mb-1">Daily sales velocity</p>
          <p className="text-lg font-bold text-sky-300 tabular-nums">
            {metrics.dailySalesVelocity > 0 ? formatCurrency(metrics.dailySalesVelocity, store.currency) : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3">
          <p className="text-xs font-medium text-sky-400/90 mb-1">Projected monthly</p>
          <p className="text-lg font-bold text-sky-300 tabular-nums">
            {metrics.projectedMonthlySales > 0 ? formatCurrency(metrics.projectedMonthlySales, store.currency) : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-xs font-medium text-amber-400/90 mb-1">Inventory depletion timeline</p>
          <p className="text-lg font-bold text-amber-300 tabular-nums">
            {metrics.inventoryDepletionDays != null ? `${metrics.inventoryDepletionDays} days` : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
          <p className="text-xs font-medium text-emerald-400/90 mb-1">Session growth rate</p>
          <p className="text-lg font-bold text-emerald-300 tabular-nums">
            {metrics.sessionGrowthRate != null && metrics.sessionGrowthRate > 0
              ? `${Number(metrics.sessionGrowthRate).toFixed(1)}%`
              : '—'}
          </p>
          {metrics.sessionGrowthRate == null && (
            <p className="text-[10px] text-emerald-400/70 mt-0.5">Requires period comparison</p>
          )}
        </div>
      </div>
    </section>
  );
}
