'use client';

import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useAuditStore } from '../context/AuditStoreContext';
import { formatCurrency, formatPercent } from '../utils/formatNumber';
import type { KeywordMetrics } from '../utils/aggregation';

export default function AsinProfitabilityTable() {
  const { state } = useAuditStore();
  const [expandedAsin, setExpandedAsin] = useState<string | null>(null);

  const asinList = useMemo(
    () => Object.values(state.store.asinMetrics).sort((a, b) => b.adSpend - a.adSpend),
    [state.store.asinMetrics]
  );

  const keywordsByAsin = useMemo(() => {
    const map = new Map<string, KeywordMetrics[]>();
    for (const kw of Object.values(state.store.keywordMetrics)) {
      if (kw.asin) {
        const list = map.get(kw.asin) ?? [];
        list.push(kw);
        map.set(kw.asin, list);
      }
    }
    return map;
  }, [state.store.keywordMetrics]);

  const currency = state.store.currency;

  if (asinList.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-[var(--color-text-muted)] text-sm">
        No ASIN-level data. Upload advertising and business reports to see ASIN profitability.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-text-muted)]">
        ASIN-Level Profitability (ACOS Optimiser). Click &quot;Show Detail&quot; to see keywords targeting each ASIN.
      </p>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm" role="table" aria-label="ASIN profitability">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="w-10 px-2 py-3" aria-label="Expand" />
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text)]">ASIN</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--color-text)]">Sessions</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--color-text)]">Page Views</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--color-text)]">Buy Box %</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--color-text)]">Ad Spend</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--color-text)]">Ad Sales</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--color-text)]">Total ASIN Sales</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--color-text)]">ACOS</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--color-text)]">TACOS</th>
            </tr>
          </thead>
          <tbody>
            {asinList.map((m) => {
              const isExpanded = expandedAsin === m.asin;
              const keywords = keywordsByAsin.get(m.asin) ?? [];
              return (
                <Fragment key={m.asin}>
                  <tr
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => setExpandedAsin(isExpanded ? null : m.asin)}
                        className="p-1 rounded text-[var(--color-text-muted)] hover:text-cyan-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? 'Hide detail' : 'Show detail'}
                      >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                    </td>
                    <td className="px-4 py-2 font-mono text-[var(--color-text)]">{m.asin}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{m.sessions}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{m.pageViews}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {m.buyBoxPercent != null ? formatPercent(m.buyBoxPercent) : '—'}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {currency ? formatCurrency(m.adSpend, currency) : m.adSpend.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {currency ? formatCurrency(m.adSales, currency) : m.adSales.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {currency ? formatCurrency(m.totalSales, currency) : m.totalSales.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{formatPercent(m.acos)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {m.totalSales > 0 ? formatPercent((m.adSpend / m.totalSales) * 100) : '—'}
                    </td>
                  </tr>
                  {isExpanded && keywords.length > 0 && (
                    <tr key={`${m.asin}-detail`} className="bg-white/5">
                      <td colSpan={10} className="px-4 py-3">
                        <div className="rounded-lg border border-white/10 bg-[var(--color-surface-elevated)] p-4">
                          <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
                            Keywords targeting this ASIN
                          </p>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-[var(--color-text-muted)]">
                                <th className="pb-2 font-medium">Search Term</th>
                                <th className="pb-2 font-medium">Campaign</th>
                                <th className="pb-2 font-medium text-right">Spend</th>
                                <th className="pb-2 font-medium text-right">Sales</th>
                                <th className="pb-2 font-medium text-right">ACOS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {keywords.map((kw, i) => (
                                <tr key={i} className="border-t border-white/5">
                                  <td className="py-1.5 text-[var(--color-text)] max-w-[200px] truncate">
                                    {kw.searchTerm || '—'}
                                  </td>
                                  <td className="py-1.5 text-[var(--color-text-muted)]">{kw.campaign || '—'}</td>
                                  <td className="py-1.5 text-right tabular-nums">
                                    {currency ? formatCurrency(kw.spend, currency) : kw.spend.toFixed(2)}
                                  </td>
                                  <td className="py-1.5 text-right tabular-nums">
                                    {currency ? formatCurrency(kw.sales, currency) : kw.sales.toFixed(2)}
                                  </td>
                                  <td className="py-1.5 text-right tabular-nums">{formatPercent(kw.acos)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
