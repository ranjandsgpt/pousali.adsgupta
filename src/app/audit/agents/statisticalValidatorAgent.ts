/**
 * Phase 3 — Statistical Validator Agent.
 * 50+ rules for impossible or suspicious metrics.
 * Metrics below 80% confidence must not appear in the UI.
 */

import type { MemoryStore } from '../utils/reportParser';

export const STATISTICAL_CONFIDENCE_TARGET = 0.8;

export interface ValidationRule {
  id: string;
  metric: string;
  check: (value: number, context?: Record<string, number>) => boolean;
  reason: string;
  severity: 'invalid' | 'anomaly';
}

export interface StatisticalValidationResult {
  passed: boolean;
  confidence: number;
  anomalies: { metric: string; value: number; reason: string; severity: string }[];
  /** Number of rules that fired. */
  rulesTriggered: number;
  /** When validation did not pass: recommend escalating to Gemini for analysis. */
  needsGeminiEscalation: boolean;
}

function rule(
  id: string,
  metric: string,
  check: (v: number, ctx?: Record<string, number>) => boolean,
  reason: string,
  severity: 'invalid' | 'anomaly' = 'anomaly'
): ValidationRule {
  return { id, metric, check, reason, severity };
}

const RULES: ValidationRule[] = [
  rule('acos_gt_500', 'ACOS', (v) => v > 500, 'ACOS > 500% is implausible'),
  rule('acos_lt_0', 'ACOS', (v) => v < 0, 'ACOS < 0 is invalid', 'invalid'),
  rule('acos_gt_200', 'ACOS', (v) => v > 200, 'ACOS > 200% is anomalous'),
  rule('roas_lt_0', 'ROAS', (v) => v < 0, 'ROAS < 0 is invalid', 'invalid'),
  rule('roas_gt_100', 'ROAS', (v) => v > 100, 'ROAS > 100 is anomalous'),
  rule('roas_lt_0_2', 'ROAS', (v) => v >= 0 && v < 0.2, 'ROAS < 0.2 may indicate data error'),
  rule('ctr_gt_40', 'CTR', (v) => v > 40, 'CTR > 40% is anomalous'),
  rule('ctr_lt_0', 'CTR', (v) => v < 0, 'CTR < 0% is invalid', 'invalid'),
  rule('ctr_gt_30', 'CTR', (v) => v > 30, 'CTR > 30% is suspicious'),
  rule('cpc_gt_50', 'CPC', (v) => v > 50, 'CPC > $50 is anomalous'),
  rule('cpc_lt_0', 'CPC', (v) => v < 0, 'CPC < 0 is invalid', 'invalid'),
  rule('cpc_gt_20', 'CPC', (v) => v > 20, 'CPC > $20 is suspicious'),
  rule('cvr_gt_70', 'CVR', (v) => v > 70, 'CVR > 70% is anomalous'),
  rule('cvr_lt_0', 'CVR', (v) => v < 0, 'CVR < 0% is invalid', 'invalid'),
  rule('cvr_gt_50', 'CVR', (v) => v > 50, 'CVR > 50% is suspicious'),
  rule('tacos_lt_0', 'TACOS', (v) => v < 0, 'TACOS < 0 is invalid', 'invalid'),
  rule('tacos_gt_100', 'TACOS', (v) => v > 100, 'TACOS > 100% is anomalous'),
  rule('tacos_gt_80', 'TACOS', (v) => v > 80, 'TACOS > 80% is suspicious'),
  rule('spend_lt_0', 'Spend', (v) => v < 0, 'Spend < 0 is invalid', 'invalid'),
  rule('sales_lt_0', 'Sales', (v) => v < 0, 'Sales < 0 is invalid', 'invalid'),
  rule('clicks_lt_0', 'Clicks', (v) => v < 0, 'Clicks < 0 is invalid', 'invalid'),
  rule('impressions_lt_0', 'Impressions', (v) => v < 0, 'Impressions < 0 is invalid', 'invalid'),
  rule('orders_lt_0', 'Orders', (v) => v < 0, 'Orders < 0 is invalid', 'invalid'),
  rule('sessions_lt_0', 'Sessions', (v) => v < 0, 'Sessions < 0 is invalid', 'invalid'),
  rule('units_lt_0', 'Units', (v) => v < 0, 'Units < 0 is invalid', 'invalid'),
  rule('buybox_lt_0', 'Buy Box %', (v) => v < 0, 'Buy Box % < 0 is invalid', 'invalid'),
  rule('buybox_gt_100', 'Buy Box %', (v) => v > 100, 'Buy Box % > 100 is invalid', 'invalid'),
  rule('pageviews_lt_0', 'Page Views', (v) => v < 0, 'Page Views < 0 is invalid', 'invalid'),
  rule('spend_gt_sales_10x', 'Spend', (spend, ctx) => {
    const sales = ctx?.sales ?? 0;
    return sales > 0 && spend > sales * 10;
  }, 'Spend > 10× sales is anomalous'),
  rule('units_gt_sessions', 'Units', (units, ctx) => {
    const sessions = ctx?.sessions ?? 0;
    return sessions > 0 && units > sessions;
  }, 'Units > sessions is anomalous'),
  rule('orders_gt_clicks', 'Orders', (orders, ctx) => {
    const clicks = ctx?.clicks ?? 0;
    return clicks > 0 && orders > clicks;
  }, 'Orders > clicks is anomalous'),
  rule('sales_gt_total_store', 'Ad Sales', (adSales, ctx) => {
    const total = ctx?.totalStoreSales ?? 0;
    return total > 0 && adSales > total;
  }, 'Ad sales > total store sales is invalid', 'invalid'),
  rule('spend_gt_total_store', 'Ad Spend', (spend, ctx) => {
    const total = ctx?.totalStoreSales ?? 0;
    return total > 0 && spend > total;
  }, 'Ad spend > total store sales is anomalous'),
  rule('acos_nan', 'ACOS', (v) => Number.isNaN(v) || !Number.isFinite(v), 'ACOS is NaN or infinite', 'invalid'),
  rule('roas_nan', 'ROAS', (v) => Number.isNaN(v) || !Number.isFinite(v), 'ROAS is NaN or infinite', 'invalid'),
  rule('ctr_nan', 'CTR', (v) => Number.isNaN(v) || !Number.isFinite(v), 'CTR is NaN or infinite', 'invalid'),
  rule('cpc_nan', 'CPC', (v) => Number.isNaN(v) || !Number.isFinite(v), 'CPC is NaN or infinite', 'invalid'),
  rule('cvr_nan', 'CVR', (v) => Number.isNaN(v) || !Number.isFinite(v), 'CVR is NaN or infinite', 'invalid'),
  rule('tacos_nan', 'TACOS', (v) => Number.isNaN(v) || !Number.isFinite(v), 'TACOS is NaN or infinite', 'invalid'),
  rule('impressions_lt_clicks', 'Impressions', (imp, ctx) => {
    const clicks = ctx?.clicks ?? 0;
    return imp >= 0 && clicks > 0 && imp < clicks;
  }, 'Impressions < clicks is invalid', 'invalid'),
  rule('conversion_rate_gt_100', 'Conversion Rate', (v) => v > 100, 'Conversion rate > 100% is invalid', 'invalid'),
  rule('conversion_rate_lt_0', 'Conversion Rate', (v) => v < 0, 'Conversion rate < 0 is invalid', 'invalid'),
  rule('unit_session_gt_100', 'Unit Session %', (v) => v > 100, 'Unit Session % > 100 is invalid', 'invalid'),
  rule('unit_session_lt_0', 'Unit Session %', (v) => v < 0, 'Unit Session % < 0 is invalid', 'invalid'),
  rule('budget_lt_0', 'Budget', (v) => v < 0, 'Budget < 0 is invalid', 'invalid'),
  rule('budget_gt_100000', 'Budget', (v) => v > 100_000, 'Budget > $100k is suspicious'),
  rule('spend_gt_1m', 'Spend', (v) => v > 1_000_000, 'Spend > $1M may need verification'),
  rule('sales_gt_10m', 'Sales', (v) => v > 10_000_000, 'Sales > $10M may need verification'),
  rule('clicks_gt_10m', 'Clicks', (v) => v > 10_000_000, 'Clicks > 10M may need verification'),
  rule('impressions_gt_1b', 'Impressions', (v) => v > 1_000_000_000, 'Impressions > 1B may need verification'),
  rule('roas_gt_50', 'ROAS', (v) => v > 50, 'ROAS > 50 is suspicious'),
  rule('acos_gt_100_lt_200', 'ACOS', (v) => v > 100 && v <= 200, 'ACOS 100–200% is high'),
  rule('cvr_gt_30_lt_50', 'CVR', (v) => v > 30 && v <= 50, 'CVR 30–50% is high'),
  rule('ctr_gt_20_lt_40', 'CTR', (v) => v > 20 && v <= 40, 'CTR 20–40% is high'),
  rule('tacos_gt_50', 'TACOS', (v) => v > 50, 'TACOS > 50% is high'),
  rule('organic_lt_0', 'Organic Sales', (v) => v < 0, 'Organic sales < 0 is invalid', 'invalid'),
  rule('contribution_margin_gt_100', 'Contribution Margin %', (v) => v > 100, 'Contribution margin > 100% is invalid', 'invalid'),
  rule('contribution_margin_lt_neg100', 'Contribution Margin %', (v) => v < -100, 'Contribution margin < -100% is anomalous'),
  rule('lost_revenue_lt_0', 'Lost Revenue Est', (v) => v < 0, 'Lost revenue estimate < 0 is invalid', 'invalid'),
  rule('ad_sales_pct_gt_100', 'Ad Sales %', (v) => v > 100, 'Ad Sales % > 100 is invalid', 'invalid'),
  rule('ad_sales_pct_lt_0', 'Ad Sales %', (v) => v < 0, 'Ad Sales % < 0 is invalid', 'invalid'),
  // Distribution / rollup checks (use context from store)
  rule('sales_lt_spend_ratio', 'Ad Sales', (sales, ctx) => {
    const spend = ctx?.spend ?? 0;
    return spend > 0 && sales >= 0 && sales < spend * 0.1;
  }, 'Ad sales < 10% of spend may indicate data error'),
  rule('negative_margin', 'Contribution Margin %', (v) => v < -100, 'Contribution margin < -100% is invalid', 'invalid'),
  rule('max_keyword_spend_gt_account', 'Spend', (accountSpend, ctx) => {
    const maxKw = ctx?.maxKeywordSpend ?? 0;
    return accountSpend > 0 && maxKw > accountSpend;
  }, 'Single keyword spend > account spend is invalid', 'invalid'),
  rule('keyword_campaign_spend_mismatch', 'Spend', (_v, ctx) => {
    const kw = ctx?.keywordSpendSum ?? 0;
    const camp = ctx?.campaignSpendSum ?? 0;
    if (camp <= 0) return false;
    const ratio = kw / camp;
    return ratio < 0.5 || ratio > 1.5;
  }, 'Keyword total spend vs campaign total spend mismatch', 'anomaly'),
];

function buildMetricContext(store: MemoryStore): Record<string, number> {
  const totalSales = store.totalStoreSales || store.storeMetrics.totalSales;
  const totalClicks = store.totalClicks || Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);
  const totalOrders = store.totalOrders ?? 0;
  const totalSessions = store.totalSessions || Object.values(store.asinMetrics).reduce((s, a) => s + a.sessions, 0);
  const keywordSpendSum = Object.values(store.keywordMetrics).reduce((s, k) => s + k.spend, 0);
  const campaignSpendSum = Object.values(store.campaignMetrics).reduce((s, c) => s + c.spend, 0);
  const maxKeywordSpend = Object.values(store.keywordMetrics).reduce((m, k) => Math.max(m, k.spend), 0);
  return {
    totalStoreSales: totalSales,
    sales: store.totalAdSales,
    spend: store.totalAdSpend,
    clicks: totalClicks,
    impressions: store.totalImpressions,
    orders: totalOrders,
    sessions: totalSessions,
    units: store.totalUnitsOrdered,
    acos: store.totalAdSales > 0 ? (store.totalAdSpend / store.totalAdSales) * 100 : 0,
    roas: store.totalAdSpend > 0 ? store.totalAdSales / store.totalAdSpend : 0,
    tacos: totalSales > 0 ? (store.totalAdSpend / totalSales) * 100 : 0,
    ctr: store.totalImpressions > 0 ? (totalClicks / store.totalImpressions) * 100 : 0,
    cpc: totalClicks > 0 ? store.totalAdSpend / totalClicks : 0,
    cvr: totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0,
    keywordSpendSum,
    campaignSpendSum,
    maxKeywordSpend,
  };
}

const METRIC_TO_KEY: Record<string, string> = {
  'ACOS': 'acos',
  'ROAS': 'roas',
  'TACOS': 'tacos',
  'CTR': 'ctr',
  'CPC': 'cpc',
  'CVR': 'cvr',
  'Spend': 'spend',
  'Sales': 'sales',
  'Ad Sales': 'sales',
  'Ad Spend': 'spend',
  'Clicks': 'clicks',
  'Impressions': 'impressions',
  'Orders': 'orders',
  'Sessions': 'sessions',
  'Units': 'units',
  'Buy Box %': 'buyBox',
  'Page Views': 'pageViews',
  'Conversion Rate': 'conversionRate',
  'Organic Sales': 'organicSales',
  'Ad Sales %': 'adSalesPercent',
  'Contribution Margin %': 'contributionMargin',
  'Lost Revenue Est': 'lostRevenue',
  'Budget': 'budget',
  'Unit Session %': 'unitSession',
};

export function runStatisticalValidatorAgent(store: MemoryStore): StatisticalValidationResult {
  const anomalies: { metric: string; value: number; reason: string; severity: string }[] = [];
  const ctx = buildMetricContext(store);
  const extendedCtx = {
    ...ctx,
    buyBox: store.buyBoxPercent,
    pageViews: store.totalPageViews,
    conversionRate: store.storeMetrics.conversionRate,
    organicSales: store.storeMetrics.organicSales,
    adSalesPercent: store.storeMetrics.adSalesPercent,
    contributionMargin: store.storeMetrics.profitabilityScore * 100,
    lostRevenue: store.storeMetrics.lostRevenueEstimate ?? 0,
    budget: Object.values(store.campaignMetrics).reduce((s, c) => s + (c.budget ?? 0), 0),
    unitSession: 0,
  };

  for (const r of RULES) {
    const key = METRIC_TO_KEY[r.metric] ?? r.metric.toLowerCase().replace(/\s+/g, '').replace('%', '');
    const value = extendedCtx[key as keyof typeof extendedCtx] ?? (ctx[key as keyof typeof ctx] as number) ?? 0;
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    if (r.check(value, ctx)) {
      anomalies.push({ metric: r.metric, value, reason: r.reason, severity: r.severity });
    }
  }

  const invalidCount = anomalies.filter((a) => a.severity === 'invalid').length;
  const rulesTriggered = anomalies.length;
  const confidence = invalidCount > 0 ? 0 : Math.max(0, 1 - (rulesTriggered / Math.max(1, RULES.length)) * 1.5);
  const passed = confidence >= STATISTICAL_CONFIDENCE_TARGET && invalidCount === 0;
  const needsGeminiEscalation = !passed && (invalidCount > 0 || rulesTriggered > 0);

  return {
    passed,
    confidence: Math.round(confidence * 100) / 100,
    anomalies,
    rulesTriggered,
    needsGeminiEscalation,
  };
}
