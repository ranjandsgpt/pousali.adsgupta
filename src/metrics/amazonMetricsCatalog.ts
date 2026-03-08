/**
 * Phase 1 — Canonical Metrics Layer.
 * Single source of truth for every metric. Prevents double counting across Campaign, Targeting, Search Term reports.
 */

export type SourceReport = 'campaign_report' | 'targeting_report' | 'search_term_report' | 'business_report';

export interface CanonicalMetricSource {
  source: SourceReport;
  aggregation: 'sum' | 'avg' | 'count';
  field: string;
}

export interface CanonicalMetricFormula {
  formula: string;
  dependencies: string[];
}

export type CanonicalMetricDef = { source: SourceReport; aggregation: 'sum' | 'avg'; field: string } | CanonicalMetricFormula;

export const AMAZON_METRICS: Record<string, CanonicalMetricDef> = {
  totalAdSpend: {
    source: 'campaign_report',
    aggregation: 'sum',
    field: 'spend',
  },
  totalAdSales: {
    source: 'campaign_report',
    aggregation: 'sum',
    field: 'sales',
  },
  totalSales: {
    formula: 'adSales + organicSales',
    dependencies: ['adSales', 'organicSales'],
  },
  organicSales: {
    formula: 'totalSales - adSales',
    dependencies: ['totalSales', 'adSales'],
  },
  tacos: {
    formula: 'adSpend / totalSales',
    dependencies: ['adSpend', 'totalSales'],
  },
  acos: {
    formula: 'adSpend / adSales',
    dependencies: ['adSpend', 'adSales'],
  },
  roas: {
    formula: 'adSales / adSpend',
    dependencies: ['adSales', 'adSpend'],
  },
  cvr: {
    formula: 'orders / clicks',
    dependencies: ['orders', 'clicks'],
  },
  ctr: {
    formula: 'clicks / impressions',
    dependencies: ['clicks', 'impressions'],
  },
  cpc: {
    formula: 'adSpend / clicks',
    dependencies: ['adSpend', 'clicks'],
  },
  totalClicks: {
    source: 'campaign_report',
    aggregation: 'sum',
    field: 'clicks',
  },
  totalImpressions: {
    source: 'campaign_report',
    aggregation: 'sum',
    field: 'impressions',
  },
  totalOrders: {
    source: 'business_report',
    aggregation: 'sum',
    field: 'orders',
  },
};

export function getCanonicalMetric(key: string): CanonicalMetricDef | undefined {
  return AMAZON_METRICS[key];
}

export function isSourceMetric(def: CanonicalMetricDef): def is { source: SourceReport; aggregation: 'sum' | 'avg'; field: string } {
  return 'source' in def && 'field' in def;
}
