'use client';

import { TabPatternDetection, TabOpportunityDetection, TabDataTablesSection, TabVisualization } from './TabSections';
import { InsightModuleCard } from './InsightModuleCard';
import { DeepDivePanel } from './DeepDivePanel';
import { ChartRegistry, ChartsLabGrid } from './ChartRegistry';
import FunnelOverviewChart from '../charts/FunnelOverviewChart';
import KeywordProfitabilityMapChart from '../charts/KeywordProfitabilityMapChart';
import { useTabData, type TabId } from './useTabData';

import LearningIntelligencePanel from '../components/LearningIntelligencePanel';
import GeminiInsightsPanel from '../components/GeminiInsightsPanel';
import AuditCopilot from '../components/AuditCopilot';
import DiscoveredInsightsSection from '../components/DiscoveredInsightsSection';
import WastedSearchTermsTable from '../components/WastedSearchTermsTable';
import { usePendingCopilotQuestion } from '../context/PendingCopilotQuestionContext';
import type { RowActionType } from './types';

export interface TabContentProps {
  tabId: TabId;
  onNavigateToTab?: (tab: TabId) => void;
}

export function TabContent({ tabId, onNavigateToTab }: TabContentProps) {
  const { patterns, opportunities, insightModules, tables, chartIds, currency } = useTabData(tabId);
  const { setPendingQuestion } = usePendingCopilotQuestion();
  const onTableAction = (tableTitle: string, row: Record<string, unknown>, actionType: RowActionType) => {
    if (tableTitle === 'ASIN performance' && actionType === 'view' && row.asin) {
      setPendingQuestion(`Tell me about ASIN ${row.asin} — what should I do with it?`);
      onNavigateToTab?.('gemini-insights');
    }
  };

  if (tabId === 'gemini-insights') {
    return (
      <div className="space-y-6">
        <section className="w-full">
          <AuditCopilot />
        </section>
        <section>
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Executive Narrative</h3>
          <GeminiInsightsPanel />
        </section>
        <section>
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Learning from data</h3>
          <LearningIntelligencePanel />
        </section>
        <section>
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Strategic Recommendations</h3>
          <p className="text-sm text-[var(--color-text-muted)] mb-2">Key risks, growth opportunities, and optimization plan from campaign and keyword performance.</p>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text-muted)]">
            Review the Executive Narrative and Learning from data above for specific risks, opportunities, and action items.
          </div>
        </section>
      </div>
    );
  }

  if (tabId === 'insights-reports') {
    return (
      <div className="space-y-6">
        {insightModules.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Diagnostic insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insightModules.map((mod) => (
                <InsightModuleCard key={mod.id} module={mod}>
                  {mod.deepDiveTable && <DeepDivePanel title={mod.title} table={mod.deepDiveTable} currency={currency} />}
                </InsightModuleCard>
              ))}
            </div>
          </section>
        )}
        <section>
          <KeywordProfitabilityMapChart />
        </section>
        <section>
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Charts Lab</h3>
          <ChartsLabGrid />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tabId === 'overview' && (
        <>
          <section className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Funnel</h3>
            <FunnelOverviewChart />
          </section>
          <DiscoveredInsightsSection />
          {insightModules.length > 0 && (
            <section id="critical-section">
              <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Critical Issues & Growth Opportunities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insightModules.map((mod) => (
                  <InsightModuleCard
                    key={mod.id}
                    module={mod}
                    onNavigateToCampaigns={mod.id === 'critical' || mod.id === 'opportunities' ? onNavigateToTab ? () => onNavigateToTab('campaigns-budget') : undefined : undefined}
                  >
                    {mod.deepDiveTable && <DeepDivePanel title={mod.title} table={mod.deepDiveTable} currency={currency} />}
                  </InsightModuleCard>
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
              <InsightModuleCard key={mod.id} module={mod}>
                {mod.deepDiveTable && <DeepDivePanel title={mod.title} table={mod.deepDiveTable} currency={currency} />}
              </InsightModuleCard>
            ))}
          </div>
        </section>
      )}

      {tabId === 'keywords-search-terms' && (
        <section>
          <WastedSearchTermsTable />
        </section>
      )}

      {tabId === 'overview' && (patterns.length > 0 || opportunities.length > 0) && (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patterns.length > 0 && (
              <TabPatternDetection patterns={patterns.slice(0, 5)} />
            )}
            {opportunities.length > 0 && (
              <TabOpportunityDetection opportunities={opportunities.slice(0, 5)} />
            )}
          </div>
        </section>
      )}

      {/* Charts Lab before Data Tables (Phase 9) */}
      {chartIds.length > 0 && (
        <TabVisualization>
          <ChartRegistry chartIds={chartIds} />
        </TabVisualization>
      )}

      <TabDataTablesSection tables={tables} currency={currency} onAction={onTableAction} />
    </div>
  );
}
