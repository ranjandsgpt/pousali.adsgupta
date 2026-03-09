import { safeDivide } from '@/app/audit/utils/mathEngine';
import { organicSales as computeOrganicSales } from '@/app/audit/utils/amazonMetricsLibrary';
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
  totalSales: number;
  organicSales: number;

  tacos: number;
  acos: number;
  roas: number;

  ctr: number;
  cvr: number;
  cpc: number;

  totalClicks: number;
  totalImpressions: number;
  totalOrders: number;
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
  const campaignRows = input.campaignReport ?? [];
  let totalAdSpend = 0;
  let totalAdSales = 0;
  let totalClicks = 0;
  let totalImpressions = 0;
  let totalOrders = 0;

  for (const row of campaignRows) {
    if (!row || typeof row !== 'object') continue;
    const r: any = row;
    totalAdSpend += toNumber(r.spend ?? r.Spend);
    const adSalesRaw =
      r[AMAZON_SALES_ATTRIBUTION_COLUMN] ??
      r.sales7d ??
      r.sales ??
      r.Sales;
    totalAdSales += toNumber(adSalesRaw);
    totalClicks += toNumber(r.clicks ?? r.Clicks);
    totalImpressions += toNumber(r.impressions ?? r.Impressions);
    const ordersRaw =
      r.orders ??
      r.Orders ??
      r['7 Day Total Orders'] ??
      r.units ??
      r.Units;
    totalOrders += toNumber(ordersRaw);
  }

  let totalSales = 0;
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
      totalSales += toNumber(orderedProductSales);
    }
  } else {
    totalSales = totalAdSales;
  }

  const organicSales = Math.max(0, computeOrganicSales(totalSales, totalAdSales));

  const tacos = safeDivide(totalAdSpend, totalSales);
  const acos = safeDivide(totalAdSpend, totalAdSales);
  const roas = safeDivide(totalAdSales, totalAdSpend);
  const ctr = safeDivide(totalClicks, totalImpressions);
  const cvr = safeDivide(totalOrders, totalClicks);
  const cpc = safeDivide(totalAdSpend, totalClicks);

  if (process.env.NEXT_PUBLIC_AUDIT_METRICS_DEBUG === 'true') {
    // eslint-disable-next-line no-console
    console.table({
      totalAdSpend,
      totalAdSales,
      totalSales,
      organicSales,
      tacos,
      acos,
      roas,
      ctr,
      cvr,
      cpc,
      totalClicks,
      totalImpressions,
      totalOrders,
    });
  }

  return {
    totalAdSpend,
    totalAdSales,
    totalSales,
    organicSales,
    tacos,
    acos,
    roas,
    ctr,
    cvr,
    cpc,
    totalClicks,
    totalImpressions,
    totalOrders,
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

