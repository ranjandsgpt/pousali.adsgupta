'use client';

import { useMemo } from 'react';
import { TabKPISummary, TabPatternDetection, TabOpportunityDetection, TabDataTablesSection, TabVisualization } from './TabSections';
import { InsightModuleCard } from './InsightModuleCard';
import { DeepDivePanel } from './DeepDivePanel';
import { ChartRegistry, ChartsLabGrid } from './ChartRegistry';
import FunnelOverviewChart from '../charts/FunnelOverviewChart';
import KeywordProfitabilityMapChart from '../charts/KeywordProfitabilityMapChart';
import { useTabData, type TabId } from './useTabData';
import { useValidatedArtifacts } from '../store/ValidatedArtifactsContext';
import { formatCurrency, formatPercent } from '../utils/formatNumber';
import type { DetectedCurrency } from '../utils/currencyDetector';
import type { KPIMetric } from './types';

import LearningIntelligencePanel from '../components/LearningIntelligencePanel';
import GeminiInsightsPanel from '../components/GeminiInsightsPanel';

function validatedMetricsToKPIs(
  metrics: { label: string; value: string | number; status?: string }[],
  currency: DetectedCurrency
): KPIMetric[] {
  return metrics.map((m) => {
    let value: string | number = m.value;
    if (typeof m.value === 'number') {
      const label = m.label.toLowerCase();
      if (label.includes('acos') || label.includes('tacos') || label.includes('cvr') || label.includes('conversion') || label.includes('buy box')) value = formatPercent(m.value);
      else if (label.includes('spend') || label.includes('sales') || label.includes('cpc')) value = formatCurrency(m.value, currency);
      else value = m.value;
    }
    return { label: m.label, value, status: (m.status as KPIMetric['status']) ?? 'neutral' };
  });
}

export interface TabContentProps {
  tabId: TabId;
  onNavigateToTab?: (tab: TabId) => void;
}

export function TabContent({ tabId, onNavigateToTab }: TabContentProps) {
  const { kpis, patterns, opportunities, insightModules, tables, chartIds, currency } = useTabData(tabId);
  const { validated } = useValidatedArtifacts();

  const overviewKpis = useMemo(() => {
    if (tabId !== 'overview') return kpis;
    if (validated.passed && validated.metrics.length > 0) {
      return validatedMetricsToKPIs(validated.metrics, currency);
    }
    return kpis;
  }, [tabId, kpis, validated.passed, validated.metrics, currency]);

  const overviewVerificationMeta = useMemo(() => {
    if (tabId !== 'overview' || !validated.passed || !validated.artifactConfidence) return undefined;
    const score = validated.artifactConfidence.metrics?.score ?? validated.confidence / 100;
    const percent = Math.round((score > 1 ? score : score * 100));
    const source = validated.artifactConfidence.metrics?.source ?? 'slm';
    return { confidencePercent: percent, source };
  }, [tabId, validated.passed, validated.artifactConfidence, validated.confidence]);

  if (tabId === 'insights-reports') {
    return (
      <div className="space-y-8">
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
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Master AI analysis</h3>
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
    <div className="space-y-4">
      {tabId === 'overview' && (
        <>
          <TabKPISummary
            metrics={overviewKpis}
            currency={currency}
            verificationMeta={overviewVerificationMeta}
            showFeedback={validated.passed}
          />
          <section className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Funnel</h3>
            <FunnelOverviewChart />
          </section>
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

      {tabId !== 'overview' && (tabId === 'campaigns-budget' || tabId === 'asins-products' || tabId === 'profitability-inventory') && kpis.length > 0 && (
        <TabKPISummary metrics={kpis.slice(0, 8)} currency={currency} />
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

      <TabDataTablesSection tables={tables} currency={currency} />

      {chartIds.length > 0 && (
        <TabVisualization>
          <ChartRegistry chartIds={chartIds} />
        </TabVisualization>
      )}
    </div>
  );
}
