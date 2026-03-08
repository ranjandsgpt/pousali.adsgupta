'use client';

import { useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { runAutonomousInsightAgent } from '@/agents/autonomousInsightAgent';
import { InsightModuleCard } from '../tabs/InsightModuleCard';
import type { InsightModule } from '../tabs/types';

function discoveredToModule(d: { id: string; title: string; evidence: string; impactEstimate: string; recommendation: string; severity: 'critical' | 'warning' | 'info' }): InsightModule {
  return {
    id: d.id,
    title: d.title,
    description: d.recommendation,
    count: 1,
    impact: d.impactEstimate,
    severity: d.severity,
    evidence: { summary: d.evidence },
  };
}

export default function DiscoveredInsightsSection() {
  const { state } = useAuditStore();
  const store = state.store;
  const hasData = store.totalAdSpend > 0 || (store.totalStoreSales ?? store.storeMetrics?.totalSales ?? 0) > 0;

  const discovered = useMemo(() => {
    if (!hasData) return [];
    return runAutonomousInsightAgent(store).map(discoveredToModule);
  }, [hasData, store]);

  if (discovered.length === 0) return null;

  return (
    <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Discovered Insights</h3>
      <p className="text-xs text-[var(--color-text-muted)] mb-3">
        Automatically detected from your data — no query required.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {discovered.map((mod) => (
          <InsightModuleCard key={mod.id} module={mod}>
            {mod.evidence?.summary && (
              <p className="text-xs text-[var(--color-text-muted)]">{mod.evidence.summary}</p>
            )}
          </InsightModuleCard>
        ))}
      </div>
    </section>
  );
}
