/**
 * Structured Insights Agent — convert raw audit data into consulting intelligence tables.
 * Output integrates into PremiumState.structuredInsights (Phase 19–20).
 */

import type { MemoryStore } from '@/app/audit/utils/reportParser';
import type { StructuredInsights, StructuredInsightSection } from './zenithTypes';

export function generateAccountPerformanceSummary(_store: MemoryStore): StructuredInsightSection | undefined {
  return {
    id: 'account-performance-summary',
    title: 'Account Performance Summary',
    cxoNarrative: 'Monthly comparison of key advertising and store metrics.',
    columns: ['Month', 'Spend', 'Ad Sales', 'Total Sales', 'ACOS', 'TACOS', '% Ads'],
    rows: [],
    maxRowsPerSlide: 10,
  };
}

export function generateCampaignTypeBreakdown(store: MemoryStore): StructuredInsightSection | undefined {
  const campaigns = Object.values(store.campaignMetrics);
  const auto = campaigns.filter((c) => /auto/i.test(c.campaignName || ''));
  const manual = campaigns.filter((c) => !/auto/i.test(c.campaignName || ''));
  const rows = [
    {
      type: 'Auto',
      spend: auto.reduce((s, c) => s + c.spend, 0),
      adSales: auto.reduce((s, c) => s + c.sales, 0),
      campaigns: auto.length,
    },
    {
      type: 'Manual',
      spend: manual.reduce((s, c) => s + c.spend, 0),
      adSales: manual.reduce((s, c) => s + c.sales, 0),
      campaigns: manual.length,
    },
  ];
  return {
    id: 'campaign-type-performance',
    title: 'Campaign Type Performance',
    cxoNarrative: 'Breakdown by Auto vs Manual targeting.',
    columns: ['Type', 'Spend', 'Ad Sales', 'Campaigns'],
    rows: rows as unknown as Record<string, unknown>[],
    maxRowsPerSlide: 10,
  };
}

export function generateMatchTypePerformance(_store: MemoryStore): StructuredInsightSection | undefined {
  return {
    id: 'match-type-performance',
    title: 'Match Type Performance',
    columns: ['Match Type', 'Spend', 'Sales', 'CTR', 'CPC', 'CVR', 'ROAS', 'ACOS'],
    rows: [],
    maxRowsPerSlide: 10,
  };
}

export function generateTopAsins(store: MemoryStore): StructuredInsightSection | undefined {
  const asins = Object.values(store.asinMetrics)
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 20)
    .map((a) => ({
      ASIN: a.asin,
      AdSpend: a.adSpend,
      AdSales: a.adSales,
      TotalSales: a.totalSales,
      ACOS: a.adSales > 0 ? (a.adSpend / a.adSales) * 100 : 0,
      TACOS: a.totalSales > 0 ? (a.adSpend / a.totalSales) * 100 : 0,
    }));
  return {
    id: 'top-asins',
    title: 'Top ASINs',
    cxoNarrative: 'These ASINs drive the majority of revenue and should receive prioritized optimization.',
    columns: ['ASIN', 'Ad Spend', 'Ad Sales', 'Total Sales', 'ACOS', 'TACOS'],
    rows: asins as unknown as Record<string, unknown>[],
    maxRowsPerSlide: 10,
  };
}

export function generateBottomAsins(store: MemoryStore): StructuredInsightSection | undefined {
  const asins = Object.values(store.asinMetrics)
    .filter((a) => a.totalSales > 0)
    .sort((a, b) => a.totalSales - b.totalSales)
    .slice(0, 20)
    .map((a) => ({
      ASIN: a.asin,
      AdSpend: a.adSpend,
      AdSales: a.adSales,
      TotalSales: a.totalSales,
    }));
  return {
    id: 'bottom-asins',
    title: 'Bottom ASINs',
    columns: ['ASIN', 'Ad Spend', 'Ad Sales', 'Total Sales'],
    rows: asins as unknown as Record<string, unknown>[],
    maxRowsPerSlide: 10,
  };
}

export function generateLowCvrAsins(store: MemoryStore): StructuredInsightSection | undefined {
  const asins = Object.values(store.asinMetrics)
    .filter((a) => a.sessions > 0 && a.adSpend > 0 && a.adSales < a.adSpend * 0.5)
    .slice(0, 15)
    .map((a) => ({
      ASIN: a.asin,
      Spend: a.adSpend,
      CVR: a.sessions > 0 ? (a.totalSales / a.sessions).toFixed(2) : '—',
      PossibleReason: 'Low conversion; review listing and targeting.',
    }));
  return {
    id: 'asin-cvr-diagnostics',
    title: 'ASIN CVR Diagnostics',
    columns: ['ASIN', 'Spend', 'CVR', 'Possible reason'],
    rows: asins as unknown as Record<string, unknown>[],
    maxRowsPerSlide: 10,
  };
}

export function generateSearchQueryConversionGaps(_store: MemoryStore): StructuredInsightSection | undefined {
  return {
    id: 'search-query-conversion-gaps',
    title: 'Search Query Conversion Gaps',
    columns: ['Keyword', 'Search Volume', 'Brand CVR', 'Category CVR'],
    rows: [],
    maxRowsPerSlide: 10,
  };
}

export function generateActionPlan(_store: MemoryStore): { bullets: string[]; cxoNarrative?: string } {
  return {
    bullets: [
      'Campaign optimization: reallocate budget to high-ROAS campaigns.',
      'Keyword pruning: pause or negate zero-sales keywords with significant spend.',
      'PDP improvements: improve conversion on underperforming ASINs.',
      'Budget allocation strategy: align daily budgets with campaign performance.',
    ],
    cxoNarrative: 'Prioritized action plan based on audit findings.',
  };
}

/**
 * Run all structured insight generators and merge into StructuredInsights.
 */
export function runStructuredInsightsAgent(store: MemoryStore): StructuredInsights {
  return {
    accountPerformanceSummary: generateAccountPerformanceSummary(store),
    campaignTypePerformance: generateCampaignTypeBreakdown(store),
    matchTypePerformance: generateMatchTypePerformance(store),
    topAsins: generateTopAsins(store),
    bottomAsins: generateBottomAsins(store),
    asinCvrDiagnostics: generateLowCvrAsins(store),
    searchQueryConversionGaps: generateSearchQueryConversionGaps(store),
    actionPlan: generateActionPlan(store),
  };
}
