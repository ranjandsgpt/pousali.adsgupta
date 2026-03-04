'use client';

import { useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';

/** Section 35: Master Analysis – insight cards with title, explanation, supporting data. */
export default function MasterInsightsEngine() {
  const { state } = useAuditStore();
  const { store } = state;

  const insights = useMemo(() => {
    const campaigns = Object.values(store.campaignMetrics);
    const keywords = Object.values(store.keywordMetrics);
    const healthyRoas = keywords.filter((m) => m.sales > 0 && m.roas >= 4);
    const highAcos = keywords.filter((m) => m.sales > 0 && m.acos > 30);
    const lowAcos = keywords.filter((m) => m.sales > 0 && m.acos > 0 && m.acos < 15);
    const storeAcos = store.totalAdSales > 0 ? (store.totalAdSpend / store.totalAdSales) * 100 : 0;
    const accountHealth = storeAcos <= 20 && state.blendedROAS >= 3 ? 85 : storeAcos <= 30 ? 70 : 50;

    return [
      {
        title: 'Healthy ROAS segments',
        explanation: 'Keywords with ROAS ≥ 4× indicate efficient ad spend. Scale these for growth.',
        data: `${healthyRoas.length} keywords`,
        status: 'green' as const,
      },
      {
        title: 'High ACOS segments',
        explanation: 'Keywords with ACOS > 30% need optimization or negative targeting.',
        data: `${highAcos.length} keywords`,
        status: 'red' as const,
      },
      {
        title: 'Low ACOS opportunities',
        explanation: 'Keywords with ACOS < 15% are strong candidates for increased budget.',
        data: `${lowAcos.length} keywords`,
        status: 'green' as const,
      },
      {
        title: 'Account health summary',
        explanation: 'Overall account health based on blended ROAS and ACOS.',
        data: `${accountHealth}%`,
        status: accountHealth >= 80 ? 'green' : accountHealth >= 60 ? 'orange' : 'red',
      },
    ];
  }, [store, state.blendedROAS]);

  const statusClass: Record<'green' | 'red' | 'orange', string> = {
    green: 'border-emerald-500/30 bg-emerald-500/10',
    red: 'border-red-500/30 bg-red-500/10',
    orange: 'border-amber-500/30 bg-amber-500/10',
  };

  return (
    <section
      aria-labelledby="master-insights-heading"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-6"
    >
      <h2 id="master-insights-heading" className="text-lg font-semibold text-[var(--color-text)] mb-4">
        Master Analysis
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={`rounded-xl border p-4 ${statusClass[insight.status as keyof typeof statusClass]}`}
          >
            <h3 className="text-sm font-semibold text-[var(--color-text)]">{insight.title}</h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">{insight.explanation}</p>
            <p className="text-sm font-medium mt-2 tabular-nums">{insight.data}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
