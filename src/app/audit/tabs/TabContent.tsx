'use client';

import { TabKPISummary, TabPatternDetection, TabOpportunityDetection, TabDataTablesSection, TabVisualization } from './TabSections';
import { InsightModuleCard } from './InsightModuleCard';
import { ChartRegistry, ChartsLabGrid } from './ChartRegistry';
import FunnelOverviewChart from '../charts/FunnelOverviewChart';
import { useTabData, type TabId } from './useTabData';
import LearningIntelligencePanel from '../components/LearningIntelligencePanel';
import GeminiInsightsPanel from '../components/GeminiInsightsPanel';

export function TabContent({ tabId }: { tabId: TabId }) {
  const { kpis, patterns, opportunities, insightModules, tables, chartIds, currency } = useTabData(tabId);

  if (tabId === 'insights-reports') {
    return (
      <div className="space-y-8">
        <section>
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">AI Strategy</h3>
          <GeminiInsightsPanel />
        </section>
        <section>
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Learning from data</h3>
          <LearningIntelligencePanel />
        </section>
        <section>
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Charts Lab</h3>
          <ChartsLabGrid />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {tabId === 'overview' && (
        <>
          <TabKPISummary metrics={kpis} currency={currency} />
          <section className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Funnel</h3>
            <FunnelOverviewChart />
          </section>
          {insightModules.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Critical Issues & Opportunities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insightModules.map((mod) => (
                  <InsightModuleCard key={mod.id} module={mod} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {(tabId === 'keywords-search-terms' || tabId === 'campaigns-budget' || tabId === 'waste-bleed' || tabId === 'profitability-inventory') && insightModules.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">What to analyze</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insightModules.map((mod) => (
              <InsightModuleCard key={mod.id} module={mod} />
            ))}
          </div>
        </section>
      )}

      {tabId !== 'overview' && (tabId === 'campaigns-budget' || tabId === 'asins-products' || tabId === 'profitability-inventory') && kpis.length > 0 && (
        <TabKPISummary metrics={kpis.slice(0, 8)} currency={currency} />
      )}

      {tabId === 'overview' && patterns.length > 0 && (
        <TabPatternDetection patterns={patterns.slice(0, 5)} />
      )}
      {tabId === 'overview' && opportunities.length > 0 && (
        <TabOpportunityDetection opportunities={opportunities.slice(0, 5)} />
      )}

      <TabDataTablesSection tables={tables} currency={currency} />

      {chartIds.length > 0 && (
        <TabVisualization>
          <ChartRegistry chartIds={chartIds} />
        </TabVisualization>
      )}
    </div>
  );
}
