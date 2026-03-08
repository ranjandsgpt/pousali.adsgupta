/**
 * Metrics Catalog — Every metric supported by the platform for the Semantic Query Engine.
 */

export interface MetricDefinition {
  name: string;
  formula: string;
  dependencies: string[];
  description: string;
  dataset: string;
}

export const METRICS_CATALOG: MetricDefinition[] = [
  { name: 'ROAS', formula: 'adSales / adSpend', dependencies: ['adSales', 'adSpend'], description: 'Return on ad spend', dataset: 'campaigns' },
  { name: 'ACOS', formula: '(adSpend / adSales) * 100', dependencies: ['adSpend', 'adSales'], description: 'Advertising cost of sales %', dataset: 'campaigns' },
  { name: 'TACOS', formula: '(adSpend / totalStoreSales) * 100', dependencies: ['adSpend', 'totalStoreSales'], description: 'Total ACOS', dataset: 'campaigns' },
  { name: 'CTR', formula: '(clicks / impressions) * 100', dependencies: ['clicks', 'impressions'], description: 'Click-through rate', dataset: 'campaigns' },
  { name: 'CPC', formula: 'adSpend / clicks', dependencies: ['adSpend', 'clicks'], description: 'Cost per click', dataset: 'campaigns' },
  { name: 'CVR', formula: '(orders / clicks) * 100', dependencies: ['orders', 'clicks'], description: 'Conversion rate', dataset: 'searchTerms' },
  { name: 'Ad Sales', formula: 'sum(attributed sales)', dependencies: [], description: 'Revenue from ads', dataset: 'campaigns' },
  { name: 'Store Sales', formula: 'totalStoreSales', dependencies: [], description: 'Total store sales', dataset: 'campaigns' },
  { name: 'Waste Spend', formula: 'sum(spend where sales = 0)', dependencies: ['spend', 'sales'], description: 'Spend with zero sales', dataset: 'searchTerms' },
  { name: 'Profitability Score', formula: 'contributionMarginPct', dependencies: ['adSales', 'adSpend'], description: 'Contribution margin %', dataset: 'campaigns' },
  { name: 'Break-even ACOS', formula: 'derived from margin', dependencies: [], description: 'ACOS at break-even', dataset: 'campaigns' },
];

export function getMetricByName(name: string): MetricDefinition | undefined {
  const n = (name || '').trim();
  return METRICS_CATALOG.find((m) => m.name.toLowerCase() === n.toLowerCase());
}

export function getMetricsByDataset(dataset: string): MetricDefinition[] {
  return METRICS_CATALOG.filter((m) => m.dataset === dataset);
}
