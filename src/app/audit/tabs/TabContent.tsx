'use client';

import { TabKPISummary, TabPatternDetection, TabOpportunityDetection, TabDataTablesSection, TabVisualization } from './TabSections';
import { ChartRegistry, ChartsLabGrid } from './ChartRegistry';
import { useTabData, type TabId } from './useTabData';
import LearningIntelligencePanel from '../components/LearningIntelligencePanel';
import GeminiInsightsPanel from '../components/GeminiInsightsPanel';

export function TabContent({ tabId }: { tabId: TabId }) {
  const { kpis, patterns, opportunities, tables, chartIds, currency } = useTabData(tabId);

  if (tabId === 'learning-intelligence') {
    return (
      <div className="space-y-4">
        <LearningIntelligencePanel />
      </div>
    );
  }
  if (tabId === 'ai-strategy-engine') {
    return (
      <div className="space-y-4">
        <GeminiInsightsPanel />
      </div>
    );
  }
  if (tabId === 'charts-lab') {
    return <ChartsLabGrid />;
  }

  return (
    <div className="space-y-6">
      <TabKPISummary metrics={kpis} currency={currency} />
      <TabPatternDetection patterns={patterns} />
      <TabOpportunityDetection opportunities={opportunities} />
      <TabDataTablesSection tables={tables} currency={currency} />
      {chartIds.length > 0 && (
        <TabVisualization>
          <ChartRegistry chartIds={chartIds} />
        </TabVisualization>
      )}
    </div>
  );
}
