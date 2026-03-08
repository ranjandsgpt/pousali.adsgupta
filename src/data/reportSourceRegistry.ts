/**
 * Phase 2 — Report Source Mapping Engine.
 * Every insight uses the correct Amazon report. All agents must read from this registry.
 */

export type ReportSource = 'campaign_report' | 'targeting_report' | 'search_term_report' | 'business_report';

export const REPORT_SOURCE_REGISTRY: Record<string, { source: ReportSource }> = {
  searchTermInsights: { source: 'search_term_report' },
  keywordMatchTypeAnalysis: { source: 'targeting_report' },
  autoManualCampaignAnalysis: { source: 'targeting_report' },
  brandKeywordClassification: { source: 'targeting_report' },
  wastedSearchTerms: { source: 'search_term_report' },
  campaignPerformance: { source: 'campaign_report' },
  highCtrKeywordsNotManual: { source: 'search_term_report' },
  convertingSearchTermsMissingExact: { source: 'search_term_report' },
  targetingTypeAnalysis: { source: 'targeting_report' },
  asinPerformance: { source: 'campaign_report' },
};

export function getReportSourceForInsight(insightKey: string): ReportSource | undefined {
  return REPORT_SOURCE_REGISTRY[insightKey]?.source;
}
