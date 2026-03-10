import { safeDivide } from '@/app/audit/utils/mathEngine';
import { AMAZON_SALES_ATTRIBUTION_COLUMN } from '@/config/amazonAttribution';
import type { MemoryStore } from '@/app/audit/utils/reportParser';
import { sanitizeNumeric } from '@/utils/sanitizeNumeric';
import { applyOverrides, type OverrideState } from './overrideEngine';

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

export function executeMetricEngine(input: MetricExecutionInput, overrides?: OverrideState): CanonicalMetrics {
  const raw = overrides ? applyOverrides(input, overrides) : input;
  const input_ = raw;
  // ----- Global ad totals (single source of truth) -----
  const campaignRows = input_.campaignReport ?? [];
  const advertisedRows = input_.advertisedProductReport ?? [];
  const targetingRows = input_.targetingReport ?? [];

  let adSourceRows: any[] = [];
  // Canonical hierarchy:
  // 1) Advertised Product Report (primary)
  // 2) Targeting / Keyword Report (secondary)
  // 3) Campaign Report (fallback)
  if (advertisedRows.length > 0) {
    adSourceRows = advertisedRows;
  } else if (targetingRows.length > 0) {
    adSourceRows = targetingRows;
  } else if (campaignRows.length > 0) {
    adSourceRows = campaignRows;
  } else {
    adSourceRows = [];
  }

  let totalAdSpend = 0;
  let totalAdSales = 0;
  let totalAdClicks = 0;
  let totalAdImpressions = 0;
  let totalAdOrders = 0;

  // Per-report diagnostics (development only)
  let diagCampaign = { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0 };
  let diagAdvertised = { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0 };
  let diagTargeting = { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0 };

  const accumulateDiag = (rows: any[], diag: typeof diagCampaign) => {
    for (const row of rows) {
      if (!row || typeof row !== 'object') continue;
      const r: any = row;
      const spend = sanitizeNumeric(r.spend ?? r.Spend ?? r.Cost);
      const adSalesRaw =
        r[AMAZON_SALES_ATTRIBUTION_COLUMN] ??
        r['7 Day Total Sales'] ??
        r.sales7d ??
        r['Attributed Sales'] ??
        r.sales ??
        r.Sales;
      const clicks = sanitizeNumeric(r.clicks ?? r.Clicks);
      const impressions = sanitizeNumeric(r.impressions ?? r.Impressions);
      const ordersRaw =
        r.orders ??
        r.Orders ??
        r['7 Day Total Orders'] ??
        r['Total Order Items'] ??
        r['Units Sold'] ??
        r.units ??
        r.Units;

      diag.spend += spend;
      diag.sales += sanitizeNumeric(adSalesRaw);
      diag.clicks += clicks;
      diag.impressions += impressions;
      diag.orders += sanitizeNumeric(ordersRaw);
    }
  };

  if (process.env.NEXT_PUBLIC_AUDIT_METRICS_DEBUG === 'true') {
    accumulateDiag(campaignRows, diagCampaign);
    accumulateDiag(advertisedRows, diagAdvertised);
    accumulateDiag(targetingRows, diagTargeting);
    // eslint-disable-next-line no-console
    console.log('[AuditDebug] Campaign Report totals:', diagCampaign);
    // eslint-disable-next-line no-console
    console.log('[AuditDebug] Advertised Product Report totals:', diagAdvertised);
    // eslint-disable-next-line no-console
    console.log('[AuditDebug] Targeting Report totals:', diagTargeting);
  }

  for (const row of adSourceRows) {
    if (!row || typeof row !== 'object') continue;
    const r: any = row;
    totalAdSpend += sanitizeNumeric(r.spend ?? r.Spend ?? r.Cost);
    const adSalesRaw =
      r[AMAZON_SALES_ATTRIBUTION_COLUMN] ??
      r['7 Day Total Sales'] ??
      r.sales7d ??
      r['Attributed Sales'] ??
      r.sales ??
      r.Sales;
    totalAdSales += sanitizeNumeric(adSalesRaw);
    totalAdClicks += sanitizeNumeric(r.clicks ?? r.Clicks);
    totalAdImpressions += sanitizeNumeric(r.impressions ?? r.Impressions);
    const ordersRaw =
      r.orders ??
      r.Orders ??
      r['7 Day Total Orders'] ??
      r['Total Order Items'] ??
      r['Units Sold'] ??
      r.units ??
      r.Units;
    totalAdOrders += sanitizeNumeric(ordersRaw);
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

  // ----- Derived metrics (deterministic formulas) -----
  const organicSales = Math.max(0, totalStoreSales - totalAdSales);

  const tacos = safeDivide(totalAdSpend, totalStoreSales);
  const acos = safeDivide(totalAdSpend, totalAdSales);
  const roas = safeDivide(totalAdSales, totalAdSpend);
  const cvr = safeDivide(totalAdOrders, totalAdClicks);
  const cpc = safeDivide(totalAdSpend, totalAdClicks);
  const ctr = safeDivide(totalAdClicks, totalAdImpressions);

  if (process.env.NEXT_PUBLIC_AUDIT_METRICS_DEBUG === 'true') {
    // eslint-disable-next-line no-console
    console.log('[MetricEngine] campaign rows processed:', campaignRows.length);
    // eslint-disable-next-line no-console
    console.log('[MetricEngine] advertised rows processed:', advertisedRows.length);
    // eslint-disable-next-line no-console
    console.log('[MetricEngine] targeting rows processed:', targetingRows.length);
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

export function executeMetricEngineForStore(store: MemoryStore, overrides?: OverrideState): CanonicalMetrics {
  const totalStoreSales = store.totalStoreSales || store.storeMetrics.totalSales;

  return executeMetricEngine({
    campaignReport: [
      {
        spend: store.totalAdSpend,
        [AMAZON_SALES_ATTRIBUTION_COLUMN]: store.totalAdSales,
        clicks: store.totalClicks,
        impressions: store.totalImpressions,
        orders: store.totalOrders,
      },
    ],
    businessReport: [
      {
        'Ordered Product Sales': totalStoreSales,
      },
    ],
  }, overrides);
}

