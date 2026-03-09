import { safeDivide } from '@/app/audit/utils/mathEngine';
import { AMAZON_SALES_ATTRIBUTION_COLUMN } from '@/config/amazonAttribution';
import type { MemoryStore } from '@/app/audit/utils/reportParser';

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

function sanitizeCurrency(value: string | number): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const cleaned = value.toString().replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function toNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const normalized = trimmed.replace(/[^0-9.\-]+/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function executeMetricEngine(input: MetricExecutionInput): CanonicalMetrics {
  // ----- Global ad totals (single source of truth) -----
  const campaignRows = input.campaignReport ?? [];
  const advertisedRows = input.advertisedProductReport ?? [];
  const targetingRows = input.targetingReport ?? [];

  let adSourceRows: any[] = [];
  if (campaignRows.length > 0) {
    adSourceRows = campaignRows;
  } else if (advertisedRows.length > 0) {
    adSourceRows = advertisedRows;
  } else if (targetingRows.length > 0) {
    adSourceRows = targetingRows;
  } else {
    adSourceRows = [];
  }

  let totalAdSpend = 0;
  let totalAdSales = 0;
  let totalAdClicks = 0;
  let totalAdImpressions = 0;
  let totalAdOrders = 0;

  for (const row of adSourceRows) {
    if (!row || typeof row !== 'object') continue;
    const r: any = row;
    totalAdSpend += sanitizeCurrency((r.spend ?? r.Spend) as any);
    const adSalesRaw =
      r[AMAZON_SALES_ATTRIBUTION_COLUMN] ??
      r['7 Day Total Sales'] ??
      r.sales7d ??
      r.sales ??
      r.Sales;
    totalAdSales += sanitizeCurrency(adSalesRaw as any);
    totalAdClicks += toNumber(r.clicks ?? r.Clicks);
    totalAdImpressions += toNumber(r.impressions ?? r.Impressions);
    const ordersRaw =
      r.orders ??
      r.Orders ??
      r['7 Day Total Orders'] ??
      r['Total Order Items'] ??
      r.units ??
      r.Units;
    totalAdOrders += toNumber(ordersRaw);
  }

  // ----- Global store totals (Business Report preferred) -----
  let totalStoreSales = 0;
  let totalStoreOrders = 0;
  const businessRows = input.businessReport ?? [];
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
      totalStoreSales += sanitizeCurrency(orderedProductSales as any);
      totalStoreOrders += toNumber(ordersRaw);
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

export function executeMetricEngineForStore(store: MemoryStore): CanonicalMetrics {
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
  });
}

