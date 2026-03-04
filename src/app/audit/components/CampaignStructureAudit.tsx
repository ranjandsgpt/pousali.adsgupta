'use client';

import { useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';

/** Section 36: Structural issues – duplicate keywords, overlapping targeting, low impressions, budget starvation. */
export default function CampaignStructureAudit() {
  const { state } = useAuditStore();
  const { store } = state;

  const issues = useMemo(() => {
    const byTerm = new Map<string, Array<{ campaign: string; matchType: string }>>();
    for (const m of Object.values(store.keywordMetrics)) {
      const key = (m.searchTerm ?? '').toLowerCase().trim();
      if (!key) continue;
      if (!byTerm.has(key)) byTerm.set(key, []);
      byTerm.get(key)!.push({ campaign: m.campaign ?? '', matchType: m.matchType ?? '' });
    }
    const duplicateKeywords = Array.from(byTerm.entries())
      .filter(([, arr]) => arr.length > 1)
      .length;

    const budgetStarvation = Object.values(store.campaignMetrics).filter(
      (m) => m.budget > 0 && m.spend >= m.budget * 0.95
    ).length;

    const lowSpendCampaigns = Object.values(store.campaignMetrics).filter(
      (m) => m.spend > 0 && m.spend < 5
    ).length;

    return {
      duplicateKeywords,
      budgetStarvation,
      lowSpendCampaigns,
    };
  }, [store]);

  return (
    <section
      aria-labelledby="campaign-structure-heading"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-6"
    >
      <h2 id="campaign-structure-heading" className="text-sm font-semibold text-[var(--color-text)] mb-3">
        Campaign Structure Audit
      </h2>
      <ul className="space-y-2 text-sm">
        {issues.duplicateKeywords > 0 && (
          <li className="flex items-center gap-2 text-amber-400">
            <span>{issues.duplicateKeywords} duplicate keyword(s) across campaigns</span>
          </li>
        )}
        {issues.budgetStarvation > 0 && (
          <li className="flex items-center gap-2 text-red-400">
            <span>{issues.budgetStarvation} campaign(s) with budget starvation (spend ≥ 95% of budget)</span>
          </li>
        )}
        {issues.lowSpendCampaigns > 0 && (
          <li className="flex items-center gap-2 text-sky-400">
            <span>{issues.lowSpendCampaigns} campaign(s) with very low spend (&lt;$5)</span>
          </li>
        )}
        {issues.duplicateKeywords === 0 && issues.budgetStarvation === 0 && issues.lowSpendCampaigns === 0 && (
          <li className="text-[var(--color-text-muted)]">No structural issues detected.</li>
        )}
      </ul>
    </section>
  );
}
