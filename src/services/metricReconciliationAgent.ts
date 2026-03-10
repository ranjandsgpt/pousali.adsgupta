/**
 * Metric Reconciliation Agent: verifies data integrity and aggregation correctness
 * before metrics are finalized. Runs on report upload or analysis execution.
 */

import { AMAZON_SALES_ATTRIBUTION_COLUMN } from '@/config/amazonAttribution';
import { sanitizeNumeric } from '@/utils/sanitizeNumeric';

const CANONICAL_FIELDS = ['spend', 'sales7d', 'clicks', 'impressions', 'orders'] as const;
const CONSISTENCY_THRESHOLD_PCT = 1; // warn if reports differ by > 1%
const RECOMMENDED_SOURCE_PRIORITY = ['advertisedProductReport', 'targetingReport', 'campaignReport'] as const;
type ReportSourceKey = (typeof RECOMMENDED_SOURCE_PRIORITY)[number];

export interface ReconciliationInput {
  campaignReportRows?: any[];
  advertisedProductReportRows?: any[];
  targetingReportRows?: any[];
  searchTermReportRows?: any[];
  businessReportRows?: any[];
  /** Optional: for row-loss detection across pipeline stages */
  pipelineCounts?: {
    parser?: Partial<Record<ReportSourceKey | 'searchTermReport' | 'business', number>>;
    schema?: Partial<Record<ReportSourceKey | 'searchTermReport' | 'business', number>>;
  };
}

export interface PerReportTotals {
  spend: number;
  sales: number;
  clicks: number;
  impressions: number;
  orders: number;
}

export interface ReconciliationOutput {
  status: 'ok' | 'warning' | 'error';
  recommendedSource: ReportSourceKey | null;
  issues: string[];
  diagnostics: {
    perReportTotals: Partial<Record<ReportSourceKey | 'searchTermReport' | 'business', PerReportTotals>>;
    rowCounts: Partial<Record<ReportSourceKey | 'searchTermReport' | 'business', number>>;
  };
}

function getRowSpend(r: any): number {
  return sanitizeNumeric(r?.spend ?? r?.Spend ?? r?.Cost);
}
function getRowSales(r: any): number {
  const raw =
    r?.sales7d ??
    r?.[AMAZON_SALES_ATTRIBUTION_COLUMN] ??
    r?.['7 Day Total Sales'] ??
    r?.['Attributed Sales'] ??
    r?.sales ??
    r?.Sales;
  return sanitizeNumeric(raw);
}
function getRowClicks(r: any): number {
  return sanitizeNumeric(r?.clicks ?? r?.Clicks);
}
function getRowImpressions(r: any): number {
  return sanitizeNumeric(r?.impressions ?? r?.Impressions);
}
function getRowOrders(r: any): number {
  const raw =
    r?.orders ??
    r?.Orders ??
    r?.['7 Day Total Orders'] ??
    r?.['Total Order Items'] ??
    r?.['Units Sold'] ??
    r?.units ??
    r?.Units;
  return sanitizeNumeric(raw);
}

function aggregateRows(rows: any[]): PerReportTotals {
  const out: PerReportTotals = { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0 };
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    out.spend += getRowSpend(row);
    out.sales += getRowSales(row);
    out.clicks += getRowClicks(row);
    out.impressions += getRowImpressions(row);
    out.orders += getRowOrders(row);
  }
  return out;
}

function hasCanonicalFields(row: any): boolean {
  if (!row || typeof row !== 'object') return false;
  const r = row as Record<string, unknown>;
  return CANONICAL_FIELDS.every((f) => r[f] !== undefined && r[f] !== null);
}

function hasAnyCanonicalOrKnownAlias(row: any): boolean {
  if (!row || typeof row !== 'object') return false;
  const r = row as Record<string, unknown>;
  if (CANONICAL_FIELDS.some((f) => r[f] != null)) return true;
  const aliases = ['Spend', 'Cost', '7 Day Total Sales', 'Clicks', 'Impressions', 'Orders', 'Units'];
  return aliases.some((a) => r[a] != null);
}

/**
 * Run the Metric Reconciliation Agent. Call whenever reports are uploaded or analysis runs.
 */
export function runMetricReconciliationAgent(input: ReconciliationInput): ReconciliationOutput {
  const campaign = input.campaignReportRows ?? [];
  const advertised = input.advertisedProductReportRows ?? [];
  const targeting = input.targetingReportRows ?? [];
  const searchTerm = input.searchTermReportRows ?? [];
  const business = input.businessReportRows ?? [];

  const issues: string[] = [];
  let status = 'ok' as ReconciliationOutput['status'];

  // ---- Step 1: Row count validation ----
  const rowCounts = {
    campaignReport: campaign.length,
    advertisedProductReport: advertised.length,
    targetingReport: targeting.length,
    searchTermReport: searchTerm.length,
    business: business.length,
  };

  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_AUDIT_METRICS_DEBUG === 'true') {
    // eslint-disable-next-line no-console
    console.log('[Reconciliation] Campaign rows:', rowCounts.campaignReport);
    // eslint-disable-next-line no-console
    console.log('[Reconciliation] Advertised rows:', rowCounts.advertisedProductReport);
    // eslint-disable-next-line no-console
    console.log('[Reconciliation] Targeting rows:', rowCounts.targetingReport);
    // eslint-disable-next-line no-console
    console.log('[Reconciliation] Search term rows:', rowCounts.searchTermReport);
  }

  // ---- Step 2: Independent aggregation (canonical fields) ----
  const perReportTotals: ReconciliationOutput['diagnostics']['perReportTotals'] = {};
  if (campaign.length) perReportTotals.campaignReport = aggregateRows(campaign);
  if (advertised.length) perReportTotals.advertisedProductReport = aggregateRows(advertised);
  if (targeting.length) perReportTotals.targetingReport = aggregateRows(targeting);
  if (searchTerm.length) perReportTotals.searchTermReport = aggregateRows(searchTerm);
  if (business.length) {
    const bTotals = aggregateRows(business);
    perReportTotals.business = bTotals;
  }

  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_AUDIT_METRICS_DEBUG === 'true') {
    Object.entries(perReportTotals).forEach(([key, totals]) => {
      // eslint-disable-next-line no-console
      console.log(`[Reconciliation] ${key} totals:`, totals);
    });
  }

  // ---- Step 3: Cross-report consistency ----
  const spendAdvertised = perReportTotals.advertisedProductReport?.spend ?? 0;
  const spendTargeting = perReportTotals.targetingReport?.spend ?? 0;
  const spendCampaign = perReportTotals.campaignReport?.spend ?? 0;
  const salesAdvertised = perReportTotals.advertisedProductReport?.sales ?? 0;
  const salesTargeting = perReportTotals.targetingReport?.sales ?? 0;
  const salesCampaign = perReportTotals.campaignReport?.sales ?? 0;

  const pctDiff = (a: number, b: number) => (a > 0 ? (Math.abs(a - b) / a) * 100 : 0);
  if (spendAdvertised > 0 && spendTargeting > 0 && pctDiff(spendAdvertised, spendTargeting) > CONSISTENCY_THRESHOLD_PCT) {
    issues.push(
      `Spend mismatch: Advertised (${spendAdvertised.toFixed(2)}) vs Targeting (${spendTargeting.toFixed(2)}) > ${CONSISTENCY_THRESHOLD_PCT}%`
    );
    if (status !== 'error') status = 'warning';
  }
  if (salesAdvertised > 0 && salesTargeting > 0 && pctDiff(salesAdvertised, salesTargeting) > CONSISTENCY_THRESHOLD_PCT) {
    issues.push(
      `Sales mismatch: Advertised (${salesAdvertised.toFixed(2)}) vs Targeting (${salesTargeting.toFixed(2)}) > ${CONSISTENCY_THRESHOLD_PCT}%`
    );
    if (status !== 'error') status = 'warning';
  }
  if (spendCampaign > 0 && spendAdvertised > 0 && pctDiff(spendCampaign, spendAdvertised) > CONSISTENCY_THRESHOLD_PCT) {
    issues.push(
      `Spend mismatch: Campaign (${spendCampaign.toFixed(2)}) vs Advertised (${spendAdvertised.toFixed(2)}) > ${CONSISTENCY_THRESHOLD_PCT}%`
    );
    if (status !== 'error') status = 'warning';
  }

  // ---- Step 4: Canonical source recommendation (Search Term never for totals) ----
  let recommendedSource: ReportSourceKey | null = null;
  if (advertised.length > 0) recommendedSource = 'advertisedProductReport';
  else if (targeting.length > 0) recommendedSource = 'targetingReport';
  else if (campaign.length > 0) recommendedSource = 'campaignReport';

  // ---- Step 5: Schema validation (canonical fields exist) ----
  const allAdRows = [...campaign, ...advertised, ...targeting, ...searchTerm];
  const sampleSize = Math.min(20, allAdRows.length);
  for (let i = 0; i < sampleSize; i++) {
    const row = allAdRows[i];
    if (!hasAnyCanonicalOrKnownAlias(row)) {
      issues.push(`Row missing required metric fields (sample index ${i}). Expected canonical or known alias: spend, sales7d, clicks, impressions, orders.`);
      status = 'error';
      break;
    }
  }
  const strictCheck = allAdRows.length > 0 && allAdRows.every(hasCanonicalFields);
  if (allAdRows.length > 0 && !strictCheck && !issues.some((s) => s.includes('missing required metric fields'))) {
    issues.push('Some rows use raw header names instead of canonical fields (spend, sales7d, clicks, impressions, orders). Prefer schema-mapped fields.');
    if (status !== 'error') status = 'warning';
  }

  // ---- Step 6: Row loss detection ----
  const parser = input.pipelineCounts?.parser;
  const schema = input.pipelineCounts?.schema;
  if (parser && schema) {
    const keys: (ReportSourceKey | 'searchTermReport' | 'business')[] = [
      'advertisedProductReport',
      'targetingReport',
      'campaignReport',
      'searchTermReport',
      'business',
    ];
    for (const k of keys) {
      const p = parser[k] ?? 0;
      const s = schema[k] ?? 0;
      if (p > 0 && s !== p) {
        issues.push(`Row loss: ${k} parser rows (${p}) != schema rows (${s}).`);
        if (status !== 'error') status = 'warning';
      }
    }
  }

  return {
    status,
    recommendedSource,
    issues,
    diagnostics: {
      perReportTotals,
      rowCounts,
    },
  };
}

/**
 * Build reconciliation input from the same shape as MetricExecutionInput (for engine integration).
 */
export function reconciliationInputFromMetricInput(metricInput: {
  campaignReport?: any[];
  targetingReport?: any[];
  searchTermReport?: any[];
  advertisedProductReport?: any[];
  businessReport?: any[];
}): ReconciliationInput {
  return {
    campaignReportRows: metricInput.campaignReport,
    advertisedProductReportRows: metricInput.advertisedProductReport,
    targetingReportRows: metricInput.targetingReport,
    searchTermReportRows: metricInput.searchTermReport,
    businessReportRows: metricInput.businessReport,
  };
}
