'use client';

import { useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { formatCurrency } from '../utils/formatNumber';

/** Section 7: High clicks (e.g. 10+) and zero sales. Display Targeting/Keyword string, not SKU. */
const BLEEDER_CLICKS_MIN = 10;

export default function BleederTable() {
  const { state } = useAuditStore();

  const { totalWastedSpend, totalWastedClicks, bleedingCount, rows } = useMemo(() => {
    const list = Object.values(state.store.keywordMetrics);
    const bleeders = list.filter((m) => m.clicks >= BLEEDER_CLICKS_MIN && m.sales === 0);
    const totalSpend = bleeders.reduce((sum, m) => sum + m.spend, 0);
    const totalClicks = bleeders.reduce((sum, m) => sum + m.clicks, 0);
    return {
      totalWastedSpend: totalSpend,
      totalWastedClicks: totalClicks,
      bleedingCount: bleeders.length,
      rows: bleeders,
    };
  }, [state.store.keywordMetrics]);

  const currency = state.store.currency;

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-[var(--color-text-muted)] text-sm">
        No bleeders found (keywords/ASINs with {BLEEDER_CLICKS_MIN}+ clicks and zero sales).
      </div>
    );
  }

  const handleAddNegative = () => {
    const terms = rows.map((r) => r.searchTerm || '').filter(Boolean);
    const text = terms.join('\n');
    if (text && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-red-400/90 mb-1">Bleeding Keywords</p>
            <p className="text-xl font-bold text-red-300 tabular-nums">{bleedingCount}</p>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-red-400/90 mb-1">Total Wasted Spend</p>
            <p className="text-xl font-bold text-red-300 tabular-nums">
              {currency ? formatCurrency(totalWastedSpend, currency) : `$${totalWastedSpend.toFixed(2)}`}
            </p>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-red-400/90 mb-1">Total Wasted Clicks</p>
            <p className="text-xl font-bold text-red-300 tabular-nums">{totalWastedClicks.toLocaleString()}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAddNegative}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 font-medium text-sm hover:bg-blue-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Add Negative
        </button>
      </div>
      <p className="text-sm text-[var(--color-text-muted)]">
        Wasted Ad Spend Analyzer (Section 30): Search terms with {BLEEDER_CLICKS_MIN}+ clicks and zero sales.
      </p>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm" role="table" aria-label="Bleeder report">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text)]">Search Term</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--color-text)]">Clicks</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--color-text)]">Spend</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--color-text)]">CPC</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text)]">Match Type</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text)]">Suggested Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const cpc = r.clicks > 0 ? r.spend / r.clicks : 0;
              return (
                <tr
                  key={i}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-2 text-[var(--color-text)] max-w-[280px]" title={r.searchTerm}>
                    {r.searchTerm || '—'}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.clicks}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {currency ? formatCurrency(r.spend, currency) : r.spend.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {currency ? formatCurrency(cpc, currency) : cpc.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-[var(--color-text-muted)]">{r.matchType || '—'}</td>
                  <td className="px-4 py-2">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">
                      Negative
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
