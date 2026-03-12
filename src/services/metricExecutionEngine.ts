import { safeDivide } from '@/app/audit/utils/mathEngine';
import { AMAZON_SALES_ATTRIBUTION_COLUMN } from '@/config/amazonAttribution';
import type { MemoryStore } from '@/app/audit/utils/reportParser';
import { sanitizeNumeric } from '@/utils/sanitizeNumeric';
import { canonicalizeRow } from './schemaMapper';
import { applyOverrides, type OverrideState } from './overrideEngine';
import {
  runSelfVerificationAgent,
  selfVerificationInputFromMetricInput,
} from './selfVerificationAgent';
import { debugSchemaTotals } from './schemaMapper';

/**
 * Metric calculations must only occur in metricExecutionEngine.ts.
 * Agents must never modify metric outputs.
 * Agents are verification-only.
 */

export interface MetricExecutionInput {
  campaignReport?: any[];
  targetingReport?: any[];
  searchTermReport?: any[];
  advertisedProductReport?: any[];
  businessReport?: any[];
}

export interface CanonicalMetrics {
  totalAdSpend: number;
  totalAdSales: number;
  /** Backwards-compatible alias for totalStoreSales */
  totalSales: number;
  totalStoreSales: number;
  totalStoreOrders: number;
  organicSales: number;

  tacos: number;
  acos: number;
  roas: number;

  cvr: number;
  cpc: number;

  /** Backwards-compatible aliases for ad totals */
  totalClicks: number;
  totalImpressions: number;
  totalOrders: number;

  totalAdClicks: number;
  totalAdImpressions: number;
  totalAdOrders: number;

  /** Retained for completeness (not required by spec but used in some views) */
  ctr: number;
}

/** Prefer canonical fields (schema-mapper output); fallback to raw header names. */
function getRowSpend(r: any): number {
  return sanitizeNumeric(r.spend ?? r.Spend ?? r.Cost);
}
function getRowSales(r: any): number {
  const raw =
    r.sales7d ??
    r[AMAZON_SALES_ATTRIBUTION_COLUMN] ??
    r['7 Day Total Sales'] ??
    r['Attributed Sales'] ??
    r.sales ??
    r.Sales;
  return sanitizeNumeric(raw);
}
function getRowClicks(r: any): number {
  return sanitizeNumeric(r.clicks ?? r.Clicks);
}
function getRowImpressions(r: any): number {
  return sanitizeNumeric(r.impressions ?? r.Impressions);
}
function getRowOrders(r: any): number {
  const raw =
    r.orders ??
    r.Orders ??
    r['7 Day Total Orders'] ??
    r['Total Order Items'] ??
    r['Units Sold'] ??
    r.units ??
    r.Units;
  return sanitizeNumeric(raw);
}

/** Build MetricExecutionInput from MemoryStore with canonical row (spend, sales7d, etc.). */
export function buildMetricInputFromStore(store: MemoryStore): MetricExecutionInput {
  const totalStoreSales = (store.totalStoreSales || store.storeMetrics?.totalSales) ?? 0;
  return {
    campaignReport: [
      {
        spend: store.totalAdSpend,
        sales7d: store.totalAdSales,
        clicks: store.totalClicks,
        impressions: store.totalImpressions,
        orders: store.totalOrders,
      },
    ],
    businessReport: [{ totalSales: totalStoreSales }],
  };
}

function computeAcos(totalAdSpend: number, totalAdSales: number, overrides?: OverrideState): number {
  const variant = overrides?.formulaOverrides?.ACOS ?? 'default';
  switch (variant) {
    case 'default':
    default:
      return safeDivide(totalAdSpend, totalAdSales);
  }
}

function computeTacos(totalAdSpend: number, totalStoreSales: number, overrides?: OverrideState): number {
  const variant = overrides?.formulaOverrides?.TACOS ?? 'default';
  switch (variant) {
    case 'default':
    default:
      return safeDivide(totalAdSpend, totalStoreSales);
  }
}

function computeRoas(totalAdSpend: number, totalAdSales: number, overrides?: OverrideState): number {
  const variant = overrides?.formulaOverrides?.ROAS ?? 'default';
  switch (variant) {
    case 'default':
    default:
      return safeDivide(totalAdSales, totalAdSpend);
  }
}

function computeOrganicSales(
  totalStoreSales: number,
  totalAdSales: number,
  store: MemoryStore | null,
  overrides?: OverrideState
): number {
  const strategy = overrides?.organicSplitStrategy ?? 'residual';
  if (strategy === 'asin_join' && store && store.asinMetrics) {
    const asinMetrics = Object.values(store.asinMetrics);
    if (asinMetrics.length > 0) {
      const asinTotalSales = asinMetrics.reduce((s, a) => s + (a.totalSales ?? 0), 0);
      const asinAdSales = asinMetrics.reduce((s, a) => s + (a.adSales ?? 0), 0);
      const organic = asinTotalSales - asinAdSales;
      if (organic >= 0) return organic;
    }
  }
  return Math.max(0, totalStoreSales - totalAdSales);
}

export function executeMetricEngine(
  input: MetricExecutionInput,
  overrides?: OverrideState,
  storeForContext: MemoryStore | null = null
): CanonicalMetrics {
  const raw = overrides ? applyOverrides(input, overrides) : input;
  const input_ = raw;
  const campaignRows = input_.campaignReport ?? [];
  const advertisedRows = input_.advertisedProductReport ?? [];
  const targetingRows = input_.targetingReport ?? [];
  const searchTermRows = input_.searchTermReport ?? [];

  const verification = runSelfVerificationAgent(selfVerificationInputFromMetricInput(input_));
  const reconciliation = verification.reconciliation;
  if (verification.issues.length > 0) {
    verification.issues.forEach((issue) => {
      // eslint-disable-next-line no-console
      console.warn('[SelfVerification]', issue);
    });
  }
  if (verification.status === 'error') {
    // eslint-disable-next-line no-console
    console.error('[SelfVerification] status: error. Proceeding with metrics but review issues above.');
  }

  if (process.env.NEXT_PUBLIC_AUDIT_METRICS_DEBUG === 'true') {
    // eslint-disable-next-line no-console
    console.log('[MetricEngineInput] advertisedProductRows:', advertisedRows.length);
    // eslint-disable-next-line no-console
    console.log('[MetricEngineInput] targetingRows:', targetingRows.length);
    // eslint-disable-next-line no-console
    console.log('[MetricEngineInput] campaignRows:', campaignRows.length);
    // eslint-disable-next-line no-console
    console.log('[MetricEngineInput] searchTermRows:', searchTermRows.length);
  }

  // ----- Global ad totals (single source of truth) -----
  // Account-level ad totals MUST come from SP Advertised Product Report.
  // Targeting and Search Term reports are analysis-only and never used for totals.
  let adSourceRows: any[] = [];
  let sourceType: 'advertisedProduct' | 'targeting' | 'campaign' = 'campaign';
  if (advertisedRows.length > 0) {
    adSourceRows = advertisedRows;
    sourceType = 'advertisedProduct';
  } else if (campaignRows.length > 0) {
    adSourceRows = campaignRows;
    sourceType = 'campaign';
  }

  // Canonicalize so aggregation only reads spend, sales7d, clicks, impressions, orders
  adSourceRows = adSourceRows.map((row: any) =>
    row && typeof row === 'object' ? canonicalizeRow(row) : row
  );

  if (process.env.NEXT_PUBLIC_AUDIT_METRICS_DEBUG === 'true') {
    // eslint-disable-next-line no-console
    console.log('METRIC ENGINE SOURCE TYPE:', sourceType);
    // eslint-disable-next-line no-console
    console.log('METRIC ENGINE ROW COUNT:', adSourceRows.length);
    debugSchemaTotals(adSourceRows);
    if (adSourceRows.length > 0) {
      // eslint-disable-next-line no-console
      console.log('ENGINE SAMPLE ROW:', adSourceRows[0]);
    }
  }

  let totalAdSpend = 0;
  let totalAdSales = 0;
  let totalAdClicks = 0;
  let totalAdImpressions = 0;
  let totalAdOrders = 0;

  const diagCampaign = { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0 };
  const diagAdvertised = { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0 };
  const diagTargeting = { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0 };
  const diagSearchTerm = { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0 };

  const accumulateDiag = (rows: any[], diag: { spend: number; sales: number; clicks: number; impressions: number; orders: number }) => {
    for (const row of rows) {
      if (!row || typeof row !== 'object') continue;
      const r: any = row;
      diag.spend += getRowSpend(r);
      diag.sales += getRowSales(r);
      diag.clicks += getRowClicks(r);
      diag.impressions += getRowImpressions(r);
      diag.orders += getRowOrders(r);
    }
  };

  function debugReportTotals(rows: any[], label: string): void {
    if (process.env.NEXT_PUBLIC_AUDIT_METRICS_DEBUG !== 'true') return;
    let spend = 0;
    let sales = 0;
    for (const r of rows) {
      if (!r || typeof r !== 'object') continue;
      spend += sanitizeNumeric(r.spend ?? r.Spend ?? r.Cost);
      sales += sanitizeNumeric(r.sales7d ?? r['7 Day Total Sales'] ?? r['Attributed Sales'] ?? r.sales ?? r.Sales);
    }
    // eslint-disable-next-line no-console
    console.log(`${label} ROWS:`, rows.length);
    // eslint-disable-next-line no-console
    console.log(`${label} SPEND:`, spend);
    // eslint-disable-next-line no-console
    console.log(`${label} SALES:`, sales);
  }

  if (process.env.NEXT_PUBLIC_AUDIT_METRICS_DEBUG === 'true') {
    accumulateDiag(campaignRows, diagCampaign);
    accumulateDiag(advertisedRows, diagAdvertised);
    accumulateDiag(targetingRows, diagTargeting);
    accumulateDiag(searchTermRows, diagSearchTerm);
    debugReportTotals(advertisedRows, 'Advertised Product report');
    debugReportTotals(targetingRows, 'Targeting report');
    debugReportTotals(searchTermRows, 'Search Term report');
    debugReportTotals(campaignRows, 'Campaign report');
    // eslint-disable-next-line no-console
    console.log('[ReportTotals] AdvertisedProductReport:', { spend: diagAdvertised.spend, sales: diagAdvertised.sales });
    // eslint-disable-next-line no-console
    console.log('[ReportTotals] TargetingReport:', { spend: diagTargeting.spend, sales: diagTargeting.sales });
    // eslint-disable-next-line no-console
    console.log('[ReportTotals] CampaignReport:', { spend: diagCampaign.spend, sales: diagCampaign.sales });
    // eslint-disable-next-line no-console
    console.log('[ReportTotals] SearchTermReport:', { spend: diagSearchTerm.spend, sales: diagSearchTerm.sales });
  }

  for (const r of adSourceRows) {
    if (!r || typeof r !== 'object') continue;
    totalAdSpend += sanitizeNumeric(r.spend);
    totalAdSales += sanitizeNumeric(r.sales7d);
    totalAdClicks += sanitizeNumeric(r.clicks);
    totalAdImpressions += sanitizeNumeric(r.impressions);
    totalAdOrders += sanitizeNumeric(r.orders);
  }

  if (process.env.NEXT_PUBLIC_AUDIT_METRICS_DEBUG === 'true') {
    // eslint-disable-next-line no-console
    console.log('ENGINE SPEND:', totalAdSpend);
    // eslint-disable-next-line no-console
    console.log('ENGINE SALES:', totalAdSales);
  }

  // ----- Global store totals (Business Report preferred) -----
  let totalStoreSales = 0;
  let totalStoreOrders = 0;
  const businessRows = input_.businessReport ?? [];
  if (businessRows.length > 0) {
    for (const row of businessRows) {
      if (!row || typeof row !== 'object') continue;
      const r: any = row;
      const orderedProductSales =
        r['Ordered Product Sales'] ??
        r.orderedProductSales ??
        r.TotalSales ??
        r.totalSales;
      const ordersRaw =
        r['Total Order Items'] ??
        r.orders ??
        r.Orders ??
        r['Units Ordered'] ??
        r.units;
      totalStoreSales += sanitizeNumeric(orderedProductSales);
      totalStoreOrders += sanitizeNumeric(ordersRaw);
    }
  } else {
    // Fallback: 100% ad-dependent scenario
    totalStoreSales = totalAdSales;
    totalStoreOrders = totalAdOrders;
  }

  if (process.env.NEXT_PUBLIC_AUDIT_METRICS_DEBUG === 'true') {
    // eslint-disable-next-line no-console
    console.log('ENGINE STORE SALES:', totalStoreSales);
  }

  // ----- Derived metrics (deterministic formulas) -----
  const organicSales = computeOrganicSales(totalStoreSales, totalAdSales, storeForContext, overrides);

  const tacos = computeTacos(totalAdSpend, totalStoreSales, overrides);
  const acos = computeAcos(totalAdSpend, totalAdSales, overrides);
  const roas = computeRoas(totalAdSpend, totalAdSales, overrides);
  const cvr = safeDivide(totalAdOrders, totalAdClicks);
  const cpc = safeDivide(totalAdSpend, totalAdClicks);
  const ctr = safeDivide(totalAdClicks, totalAdImpressions);

  // Structural validation checks (ratio-based, no hardcoded thresholds).
  if (totalAdSales > totalStoreSales && totalStoreSales > 0) {
    // eslint-disable-next-line no-console
    console.error('[VALIDATION FAIL] adSales > totalSales — check report source or dedup bug', {
      totalAdSales,
      totalStoreSales,
    });
  }

  if (organicSales < 0) {
    // eslint-disable-next-line no-console
    console.error('[VALIDATION FAIL] organicSales is negative — adSales is overcounted', {
      totalAdSales,
      totalStoreSales,
      organicSales,
    });
  }

  if (totalStoreSales > 0) {
    const reconstructed = totalAdSales + organicSales;
    const drift = Math.abs(reconstructed - totalStoreSales) / totalStoreSales;
    if (drift > 0.001) {
      // eslint-disable-next-line no-console
      console.error(
        '[VALIDATION FAIL] adSales + organicSales !== totalSales',
        { totalAdSales, organicSales, totalStoreSales, drift }
      );
    }
  }

  if (process.env.NEXT_PUBLIC_AUDIT_METRICS_DEBUG === 'true') {
    // eslint-disable-next-line no-console
    console.log('[AGGREGATION COMPLETE]', {
      totalAdSpend,
      totalAdSales,
      totalAdOrders,
      totalAdClicks,
      totalAdImpressions,
      totalStoreSales,
      totalSessions: storeForContext?.totalSessions ?? 0,
      totalUnitsOrdered: storeForContext?.totalUnitsOrdered ?? 0,
      totalStoreOrders,
      organicSales,
      acos,
      tacos,
      roas,
      adCvr: cvr,
      sessionCvr:
        storeForContext && storeForContext.totalSessions > 0
          ? safeDivide(storeForContext.totalUnitsOrdered, storeForContext.totalSessions)
          : 0,
      cpc,
    });
  }

  if (process.env.NEXT_PUBLIC_AUDIT_METRICS_DEBUG === 'true') {
    // eslint-disable-next-line no-console
    console.table({
      totalAdSpend,
      totalAdSales,
      totalStoreSales,
      organicSales,
      tacos,
      acos,
      roas,
      ctr,
      cvr,
      cpc,
      totalAdClicks,
      totalAdImpressions,
      totalAdOrders,
    });
  }

  return {
    totalAdSpend,
    totalAdSales,
    totalSales: totalStoreSales,
    totalStoreSales,
    totalStoreOrders,
    organicSales,
    tacos,
    acos,
    roas,
    cvr,
    cpc,
    totalClicks: totalAdClicks,
    totalImpressions: totalAdImpressions,
    totalOrders: totalAdOrders,
    totalAdClicks,
    totalAdImpressions,
    totalAdOrders,
    ctr,
  };
}

export function executeMetricEngineForStore(
  store: MemoryStore,
  overrides?: OverrideState
): CanonicalMetrics {
  if (process.env.NEXT_PUBLIC_AUDIT_METRICS_DEBUG === 'true' && store.reportTypeTotals) {
    const rt = store.reportTypeTotals;
    if (rt.advertised_product)
      // eslint-disable-next-line no-console
      console.log('[ReportTotals] AdvertisedProductReport (parser):', { spend: rt.advertised_product.spend, sales: rt.advertised_product.sales });
    if (rt.targeting)
      // eslint-disable-next-line no-console
      console.log('[ReportTotals] TargetingReport (parser):', { spend: rt.targeting.spend, sales: rt.targeting.sales });
    if (rt.campaign)
      // eslint-disable-next-line no-console
      console.log('[ReportTotals] CampaignReport (parser):', { spend: rt.campaign.spend, sales: rt.campaign.sales });
    if (rt.search_term)
      // eslint-disable-next-line no-console
      console.log('[ReportTotals] SearchTermReport (parser):', { spend: rt.search_term.spend, sales: rt.search_term.sales });
  }

  const input = buildMetricInputFromStore(store);
  return executeMetricEngine(input, overrides, store);
}

