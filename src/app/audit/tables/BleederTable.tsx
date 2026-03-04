'use client';

import { useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { formatCurrency } from '../utils/formatNumber';

/** Section 7: High clicks (e.g. 10+) and zero sales. Display Targeting/Keyword string, not SKU. */
const BLEEDER_CLICKS_MIN = 10;

export default function BleederTable() {
  const { state } = useAuditStore();

  const { totalWastedSpend, rows } = useMemo(() => {
    const list = Object.values(state.store.keywordMetrics);
    const bleeders = list.filter((m) => m.clicks >= BLEEDER_CLICKS_MIN && m.sales === 0);
    const total = bleeders.reduce((sum, m) => sum + m.spend, 0);
    return {
      totalWastedSpend: total,
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

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wider text-amber-500/90 mb-1">
          Total Wasted Spend
        </p>
        <p className="text-2xl font-bold text-[var(--color-text)] tabular-nums">
          {currency ? formatCurrency(totalWastedSpend, currency) : `$${totalWastedSpend.toFixed(2)}`}
        </p>
      </div>
      <p className="text-sm text-[var(--color-text-muted)]">
        Wasted Ad Spend Analyzer: Targeting/Keyword string (not SKU). High clicks, zero sales.
      </p>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm" role="table" aria-label="Bleeder report">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text)]">
                Targeting / Keyword
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text)]">Campaign</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text)]">Match Type</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--color-text)]">Clicks</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--color-text)]">Wasted Spend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="px-4 py-2 text-[var(--color-text)] max-w-[280px]" title={r.searchTerm}>
                  {r.searchTerm || '—'}
                </td>
                <td className="px-4 py-2 text-[var(--color-text-muted)] max-w-[150px] truncate">
                  {r.campaign || '—'}
                </td>
                <td className="px-4 py-2 text-[var(--color-text-muted)]">{r.matchType || '—'}</td>
                <td className="px-4 py-2 text-right tabular-nums">{r.clicks}</td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {currency ? formatCurrency(r.spend, currency) : r.spend.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
