'use client';

import { useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';

/** Section 32: Organic Sales = Total Sales - Ad Sales; Halo Effect = Organic Sales / Ad Sales. Donut: Ad vs Organic. */
export default function HaloEffectCalculator() {
  const { state } = useAuditStore();
  const { store } = state;

  const { organicSales, adSales, haloRatio } = useMemo(() => {
    const total = store.totalStoreSales;
    const ad = store.totalAdSales;
    const organic = store.storeMetrics.organicSales ?? (total - ad);
    const ratio = ad > 0 ? organic / ad : 0;
    return { organicSales: organic, adSales: ad, haloRatio: ratio };
  }, [store]);

  const total = organicSales + adSales;
  const adPct = total > 0 ? (adSales / total) * 100 : 0;
  const organicPct = total > 0 ? (organicSales / total) * 100 : 0;

  return (
    <section
      aria-labelledby="halo-effect-heading"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-6"
    >
      <h2 id="halo-effect-heading" className="text-sm font-semibold text-[var(--color-text)] mb-3">
        Halo Effect (Organic Lift from Advertising)
      </h2>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="16" fill="none" stroke="var(--color-surface)" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="rgb(34 197 94 / 0.6)"
              strokeWidth="3"
              strokeDasharray={`${organicPct} ${100 - organicPct}`}
              strokeLinecap="round"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="rgb(59 130 246 / 0.6)"
              strokeWidth="3"
              strokeDasharray={`${adPct} ${100 - adPct}`}
              strokeDashoffset={-organicPct}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-emerald-400">
              {haloRatio > 0 ? `${haloRatio.toFixed(1)}×` : '—'} lift
            </span>
          </div>
        </div>
        <div className="text-sm space-y-1">
          <p className="text-[var(--color-text-muted)]">Ad sales vs Organic sales</p>
          <p className="text-emerald-400">Organic: {organicPct.toFixed(1)}%</p>
          <p className="text-blue-400">Ad: {adPct.toFixed(1)}%</p>
        </div>
      </div>
    </section>
  );
}
