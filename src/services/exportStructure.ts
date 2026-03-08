/**
 * Phase 12 — Export Structure Redesign.
 * Sections that exports must include. Overview, Campaign Type Performance, Targeting Type, Keyword Type, ASIN, Wasted Spend, Top Search Terms, Key Insights.
 */

export const EXPORT_SECTIONS = [
  'Overview',
  'Campaign Type Performance',
  'Targeting Type',
  'Auto vs Manual',
  'Manual breakdown',
  'Keyword Type',
  'ASIN Performance',
  'Wasted Spend',
  'Top Search Terms',
  'Key Insights',
] as const;

export type ExportSectionName = (typeof EXPORT_SECTIONS)[number];

export const EXPORT_SECTION_SOURCES: Record<string, string> = {
  'Campaign Type Performance': 'Campaign report (Sponsored Products, Brands, Display)',
  'Targeting Type': 'Targeting Report',
  'Auto vs Manual': 'Targeting Report',
  'Manual breakdown': 'Targeting Report (Broad, Phrase, Exact, Product Targeting)',
  'Keyword Type': 'Targeting Report (Branded, Generic, Competitor)',
  'ASIN Performance': 'Campaign Report',
  'Wasted Spend': 'Search Term Report',
  'Top Search Terms': 'Search Term Report (Top 10)',
  'Key Insights': 'Consulting summary',
};
