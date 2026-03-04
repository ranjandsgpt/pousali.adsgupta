'use client';

import { useAuditStore } from '../context/AuditStoreContext';

/** Section 33: A = ROAS > 5, B = 3–5, C = 2–3, D < 2. */
export default function ProfitabilityScore() {
  const { state } = useAuditStore();
  const roas = state.blendedROAS;

  const grade = roas >= 5 ? 'A' : roas >= 3 ? 'B' : roas >= 2 ? 'C' : 'D';
  const label = roas >= 5 ? 'Excellent ROAS' : roas >= 3 ? 'Good ROAS' : roas >= 2 ? 'Moderate ROAS' : 'Improve ROAS';

  const colorClass =
    grade === 'A'
      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      : grade === 'B'
        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
        : grade === 'C'
          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
          : 'bg-red-500/20 text-red-400 border-red-500/30';

  return (
    <section
      aria-labelledby="profitability-score-heading"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-6"
    >
      <h2 id="profitability-score-heading" className="text-sm font-semibold text-[var(--color-text)] mb-3">
        Profitability Score
      </h2>
      <div className={`rounded-xl border p-6 text-center ${colorClass}`}>
        <p className="text-4xl font-bold tabular-nums">{grade}</p>
        <p className="text-sm mt-1 opacity-90">{label}</p>
        {roas > 0 && <p className="text-xs mt-1 opacity-75">ROAS {roas.toFixed(2)}×</p>}
      </div>
    </section>
  );
}
