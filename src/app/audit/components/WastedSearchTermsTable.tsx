'use client';

import { useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { formatCurrency } from '../utils/formatNumber';

/** Wasted = spend > 0 AND 7-day attributed sales = 0. Top 10 by spend. */
export default function WastedSearchTermsTable() {
  const { state } = useAuditStore();

  const { rows, totalWasted } = useMemo(() => {
    const list = Object.values(state.store.keywordMetrics)
      .filter((k) => k.spend > 0 && k.sales === 0)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10);
    const total = list.reduce((s, k) => s + k.spend, 0);
    const cur = state.store.currency;
    const rows = list.map((k) => ({
      searchTerm: k.searchTerm,
      matchType: k.matchType ?? '—',
      campaign: k.campaign ?? '—',
      spend: k.spend,
      clicks: k.clicks,
      impressions: 0, // not in KeywordMetrics
      cvr: k.clicks > 0 ? 0 : 0,
    }));
    return { rows, totalWasted: total, currency: cur };
  }, [state.store.keywordMetrics, state.store.currency]);

  const sym = state.store.currency === 'EUR' ? '€' : state.store.currency === 'GBP' ? '£' : '$';

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-[var(--color-text-muted)] text-sm">
        No wasted search terms. Upload SP Search Term report to enable this.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Top 10 Wasted Search Terms</h3>
      <p className="text-2xl font-bold text-[var(--color-text)] mb-3">
        Total wasted spend: {sym}{totalWasted.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="py-2 pr-4 font-medium text-[var(--color-text)]">Search Term</th>
              <th className="py-2 pr-4 font-medium text-[var(--color-text)]">Match Type</th>
              <th className="py-2 pr-4 font-medium text-[var(--color-text)]">Campaign</th>
              <th className="py-2 pr-4 font-medium text-[var(--color-text)] text-right">Spend</th>
              <th className="py-2 pr-4 font-medium text-[var(--color-text)] text-right">Clicks</th>
              <th className="py-2 pr-4 font-medium text-[var(--color-text)] text-right">Impressions</th>
              <th className="py-2 pr-4 font-medium text-[var(--color-text)] text-right">CVR</th>
              <th className="py-2 font-medium text-[var(--color-text)] text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-white/5">
                <td className="py-1.5 pr-4 text-[var(--color-text)] max-w-[180px] truncate" title={r.searchTerm}>{r.searchTerm}</td>
                <td className="py-1.5 pr-4 text-[var(--color-text-muted)]">{r.matchType}</td>
                <td className="py-1.5 pr-4 text-[var(--color-text-muted)] max-w-[120px] truncate" title={r.campaign}>{r.campaign}</td>
                <td className="py-1.5 pr-4 text-right tabular-nums">{formatCurrency(r.spend, state.store.currency)}</td>
                <td className="py-1.5 pr-4 text-right tabular-nums">{r.clicks}</td>
                <td className="py-1.5 pr-4 text-right">—</td>
                <td className="py-1.5 pr-4 text-right">0%</td>
                <td className="py-1.5 text-right">
                  <button
                    type="button"
                    title="Add to your negative keyword list"
                    className="rounded border border-red-500/40 bg-red-500/20 px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/30"
                  >
                    Negate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
