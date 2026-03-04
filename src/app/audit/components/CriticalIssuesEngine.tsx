'use client';

import { useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { formatCurrency, formatPercent } from '../utils/formatNumber';

/** Section 26: Critical Issues – severity, estimated lost revenue, table preview of affected campaigns. */
const HIGH_ACOS_THRESHOLD = 30;
const EXCESSIVE_SPEND_MIN = 50;

export default function CriticalIssuesEngine() {
  const { state } = useAuditStore();
  const { store } = state;

  const issues = useMemo(() => {
    const highAcosCampaigns = Object.values(store.campaignMetrics)
      .filter((m) => m.acos > HIGH_ACOS_THRESHOLD && m.spend > 0)
      .sort((a, b) => b.acos - a.acos)
      .slice(0, 5);
    const lostFromHighAcos = highAcosCampaigns.reduce(
      (sum, m) => sum + m.spend - (m.sales * HIGH_ACOS_THRESHOLD) / 100,
      0
    );

    const excessiveSpendKeywords = Object.values(store.keywordMetrics)
      .filter((m) => m.spend >= EXCESSIVE_SPEND_MIN && m.sales === 0)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5);
    const lostFromExcessive = excessiveSpendKeywords.reduce((s, m) => s + m.spend, 0);

    return {
      highAcosCampaigns,
      estimatedLostHighAcos: Math.max(0, lostFromHighAcos),
      excessiveSpendKeywords,
      estimatedLostExcessive: lostFromExcessive,
    };
  }, [store]);

  const symbol = store.currency ? formatCurrency(0, store.currency).replace('0.00', '') : '$';

  return (
    <section
      aria-labelledby="critical-issues-heading"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-6"
    >
      <h2 id="critical-issues-heading" className="text-lg font-semibold text-[var(--color-text)] mb-4">
        Critical Issues
      </h2>
      <div className="space-y-4">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-sm font-medium text-red-400">Critical</span>
            <span className="text-sm text-red-300">
              Est. lost revenue: {formatCurrency(issues.estimatedLostHighAcos, store.currency)}
            </span>
          </div>
          <p className="text-sm text-[var(--color-text)] mb-2">High ACOS campaigns</p>
          <div className="overflow-x-auto pr-2">
            <table className="w-full text-xs min-w-0">
              <thead>
                <tr className="text-left text-[var(--color-text-muted)]">
                  <th className="pb-1 pr-2">Campaign</th>
                  <th className="pb-1 text-right min-w-[4rem]">Spend</th>
                  <th className="pb-1 text-right min-w-[4rem]">ACOS</th>
                </tr>
              </thead>
              <tbody className="text-[var(--color-text)]">
                {issues.highAcosCampaigns.slice(0, 3).map((m, i) => (
                  <tr key={i}>
                    <td className="py-0.5 pr-2 truncate max-w-[180px]" title={m.campaignName}>
                      {m.campaignName || '—'}
                    </td>
                    <td className="py-0.5 text-right tabular-nums">{formatCurrency(m.spend, store.currency)}</td>
                    <td className="py-0.5 text-right tabular-nums text-red-400">{formatPercent(m.acos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-sm font-medium text-amber-400">Warning</span>
            <span className="text-sm text-amber-300">
              Est. lost revenue: {formatCurrency(issues.estimatedLostExcessive, store.currency)}
            </span>
          </div>
          <p className="text-sm text-[var(--color-text)] mb-2">Keywords with excessive spend (zero sales)</p>
          <div className="overflow-x-auto pr-2">
            <table className="w-full text-xs min-w-0">
              <thead>
                <tr className="text-left text-[var(--color-text-muted)]">
                  <th className="pb-1 pr-2">Search Term</th>
                  <th className="pb-1 text-right">Spend</th>
                  <th className="pb-1 text-right">Clicks</th>
                </tr>
              </thead>
              <tbody className="text-[var(--color-text)]">
                {issues.excessiveSpendKeywords.slice(0, 3).map((m, i) => (
                  <tr key={i}>
                    <td className="py-0.5 pr-2 truncate max-w-[180px]" title={m.searchTerm}>
                      {m.searchTerm || '—'}
                    </td>
                    <td className="py-0.5 text-right tabular-nums">{formatCurrency(m.spend, store.currency)}</td>
                    <td className="py-0.5 text-right tabular-nums">{m.clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <span className="text-sm font-medium text-amber-400">Warning</span>
          <p className="text-sm text-[var(--color-text)] mt-1">Campaigns with poor CTR</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Requires impression data per campaign. Upload reports with Impressions column to enable.
          </p>
        </div>
      </div>
    </section>
  );
}
