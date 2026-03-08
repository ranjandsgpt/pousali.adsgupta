/**
 * Phase 18 — Calculation Registry.
 * Single source for FAQ, Copilot, Insights, Exports. All calculations defined here.
 */

export interface CalculationEntry {
  name: string;
  definition: string;
  formula: string;
  source?: string;
}

export const CALCULATION_REGISTRY: Record<string, CalculationEntry> = {
  totalAdSpend: {
    name: 'Total Ad Spend',
    definition: 'Total ad spend is the sum of all campaign spend from the Campaign Report. Do not sum across Targeting or Search Term reports to avoid double counting.',
    formula: 'SUM(campaign_report.spend)',
    source: 'Campaign Report',
  },
  totalAdSales: {
    name: 'Total Ad Sales',
    definition: 'Total attributed ad sales from the Campaign Report.',
    formula: 'SUM(campaign_report.sales)',
    source: 'Campaign Report',
  },
  totalSales: {
    name: 'Total Sales',
    definition: 'Total store sales = Ad Sales + Organic Sales.',
    formula: 'Ad Sales + Organic Sales',
  },
  organicSales: {
    name: 'Organic Sales',
    definition: 'Sales not attributed to advertising. When not directly available: Total Sales − Ad Sales.',
    formula: 'Total Sales − Ad Sales',
  },
  tacos: {
    name: 'TACOS',
    definition: 'Total Advertising Cost of Sales. Percentage of total sales spent on ads.',
    formula: 'Ad Spend / Total Sales (× 100 for %)',
  },
  acos: {
    name: 'ACOS',
    definition: 'Advertising Cost of Sales. Ad spend as percentage of ad-attributed sales.',
    formula: 'Ad Spend / Ad Sales (× 100 for %)',
  },
  roas: {
    name: 'ROAS',
    definition: 'Return on Ad Spend. Revenue per unit of spend.',
    formula: 'Ad Sales / Ad Spend',
  },
  cvr: {
    name: 'CVR',
    definition: 'Conversion rate: percentage of clicks that resulted in orders.',
    formula: 'CVR = Orders / Clicks (× 100 for %)',
  },
  ctr: {
    name: 'CTR',
    definition: 'Click-through rate: percentage of impressions that became clicks.',
    formula: 'CTR = Clicks / Impressions (× 100 for %)',
  },
  cpc: {
    name: 'CPC',
    definition: 'Cost per click.',
    formula: 'CPC = Ad Spend / Clicks',
  },
  wastedKeywords: {
    name: 'Wasted Keywords',
    definition: 'Search terms that have received at least 10 clicks but have generated zero sales. Source: Search Term Report.',
    formula: 'clicks >= 10 AND sales = 0',
    source: 'Search Term Report',
  },
  healthScore: {
    name: 'Health Score',
    definition: 'Weighted index (0–100) from profitability, waste, efficiency. Weights: profitability 40%, waste penalty 30%, ROAS 15%, TACOS 15%.',
    formula: 'Weighted(contributionMarginPct, wastePctOfSpend, roas, tacosPct)',
  },
  matchTypeSpend: {
    name: 'Match Type Spend',
    definition: 'Auto vs Manual (Targeting Report). Manual breakdown: Broad, Phrase, Exact, Product Targeting.',
    formula: 'SUM(spend) by targetingType, matchType',
    source: 'Targeting Report',
  },
  convertingSearchTermsMissingExact: {
    name: 'Converting Search Terms Missing Exact',
    definition: 'High-converting search terms not targeted as Exact match keywords. Filter: clicks > threshold, orders > 0. Group by matchType, searchTerm. Source: Search Term Report.',
    formula: 'clicks > threshold AND orders > 0, group by matchType, searchTerm',
    source: 'Search Term Report',
  },
};

export function getCalculation(key: string): CalculationEntry | undefined {
  return CALCULATION_REGISTRY[key];
}
