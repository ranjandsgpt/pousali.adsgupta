'use client';

import { useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { formatCurrency, formatPercent } from '../utils/formatNumber';

/** Section 27: Growth Opportunities – type, estimated incremental revenue, affected keywords/campaigns. */
const LOW_ACOS_THRESHOLD = 15;
const HIGH_ROAS_THRESHOLD = 5;

export default function GrowthOpportunitiesEngine() {
  const { state } = useAuditStore();
  const { store } = state;

  const opportunities = useMemo(() => {
    const lowAcosKeywords = Object.values(store.keywordMetrics)
      .filter((m) => m.sales > 0 && m.acos > 0 && m.acos < LOW_ACOS_THRESHOLD)
      .sort((a, b) => a.acos - b.acos)
      .slice(0, 5);
    const incrementalLowAcos = lowAcosKeywords.reduce((s, m) => s + m.sales * 0.2, 0);

    const highRoasCampaigns = Object.values(store.campaignMetrics)
      .filter((m) => m.spend > 0 && m.sales > 0 && (m.sales / m.spend) >= HIGH_ROAS_THRESHOLD)
      .sort((a, b) => b.sales / b.spend - a.sales / a.spend)
      .slice(0, 5);
    const incrementalRoas = highRoasCampaigns.reduce((s, m) => s + m.sales * 0.15, 0);

    const underfunded = Object.values(store.campaignMetrics)
      .filter((m) => m.budget > 0 && m.spend < m.budget * 0.8)
      .slice(0, 5);
    const incrementalUnderfunded = underfunded.reduce((s, m) => s + (m.budget - m.spend) * 0.5, 0);

    return {
      lowAcosKeywords,
      incrementalLowAcos,
      highRoasCampaigns,
      incrementalRoas,
      underfunded,
      incrementalUnderfunded,
    };
  }, [store]);

  return (
    <section
      aria-labelledby="growth-opportunities-heading"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-6"
    >
      <h2 id="growth-opportunities-heading" className="text-lg font-semibold text-[var(--color-text)] mb-4">
        Growth Opportunities
      </h2>
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-sm font-medium text-emerald-400">Scale</span>
            <span className="text-sm text-emerald-300">
              Est. incremental revenue: {formatCurrency(opportunities.incrementalLowAcos, store.currency)}
            </span>
          </div>
          <p className="text-sm text-[var(--color-text)] mb-2">Low ACOS keywords</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[var(--color-text-muted)]">
                  <th className="pb-1 pr-2">Search Term</th>
                  <th className="pb-1 text-right">Spend</th>
                  <th className="pb-1 text-right">ACOS</th>
                </tr>
              </thead>
              <tbody className="text-[var(--color-text)]">
                {opportunities.lowAcosKeywords.slice(0, 3).map((m, i) => (
                  <tr key={i}>
                    <td className="py-0.5 pr-2 truncate max-w-[180px]" title={m.searchTerm}>
                      {m.searchTerm || '—'}
                    </td>
                    <td className="py-0.5 text-right tabular-nums">{formatCurrency(m.spend, store.currency)}</td>
                    <td className="py-0.5 text-right tabular-nums text-emerald-400">{formatPercent(m.acos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-sm font-medium text-emerald-400">Scale</span>
            <span className="text-sm text-emerald-300">
              Est. incremental revenue: {formatCurrency(opportunities.incrementalRoas, store.currency)}
            </span>
          </div>
          <p className="text-sm text-[var(--color-text)] mb-2">High ROAS campaigns</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[var(--color-text-muted)]">
                  <th className="pb-1 pr-2">Campaign</th>
                  <th className="pb-1 text-right">Spend</th>
                  <th className="pb-1 text-right">ROAS</th>
                </tr>
              </thead>
              <tbody className="text-[var(--color-text)]">
                {opportunities.highRoasCampaigns.slice(0, 3).map((m, i) => (
                  <tr key={i}>
                    <td className="py-0.5 pr-2 truncate max-w-[180px]" title={m.campaignName}>
                      {m.campaignName || '—'}
                    </td>
                    <td className="py-0.5 text-right tabular-nums">{formatCurrency(m.spend, store.currency)}</td>
                    <td className="py-0.5 text-right tabular-nums text-emerald-400">
                      {(m.sales / m.spend).toFixed(2)}×
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-sm font-medium text-sky-400">Optimize</span>
            <span className="text-sm text-sky-300">
              Est. incremental revenue: {formatCurrency(opportunities.incrementalUnderfunded, store.currency)}
            </span>
          </div>
          <p className="text-sm text-[var(--color-text)] mb-2">Underfunded campaigns</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[var(--color-text-muted)]">
                  <th className="pb-1 pr-2">Campaign</th>
                  <th className="pb-1 text-right">Budget</th>
                  <th className="pb-1 text-right">Spend</th>
                </tr>
              </thead>
              <tbody className="text-[var(--color-text)]">
                {opportunities.underfunded.slice(0, 3).map((m, i) => (
                  <tr key={i}>
                    <td className="py-0.5 pr-2 truncate max-w-[180px]" title={m.campaignName}>
                      {m.campaignName || '—'}
                    </td>
                    <td className="py-0.5 text-right tabular-nums">{formatCurrency(m.budget, store.currency)}</td>
                    <td className="py-0.5 text-right tabular-nums">{formatCurrency(m.spend, store.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
