/**
 * Pipeline A — SLM Analytics Engine.
 * Deterministic metrics, tables, charts, insights from MemoryStore.
 */

import type { MemoryStore } from '../utils/reportParser';
import { runDiagnosticEngines } from '../engines';
import { executeMetricEngineForStore } from '@/services/metricExecutionEngine';
import { runSanityChecks } from '../utils/sanityChecks';
import type {
  EngineArtifacts,
  MetricItem,
  TableArtifact,
  ChartArtifact,
  InsightArtifact,
} from './types';

function buildSlmMetrics(store: MemoryStore): MetricItem[] {
  const m = store.storeMetrics;
  const canonical = executeMetricEngineForStore(store);

  const acos = canonical.acos * 100;
  const tacos = canonical.tacos * 100;
  const roas = canonical.roas;

  const totalClicks =
    canonical.totalClicks > 0
      ? canonical.totalClicks
      : store.totalClicks || Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);

  const cpc = canonical.cpc > 0 ? canonical.cpc : totalClicks > 0 ? store.totalAdSpend / totalClicks : 0;
  return [
    { label: 'Total Ad Spend', value: store.totalAdSpend, numericValue: store.totalAdSpend, status: 'neutral' },
    { label: 'Total Ad Sales', value: store.totalAdSales, numericValue: store.totalAdSales, status: 'neutral' },
    {
      label: 'Total Store Sales',
      value: store.totalStoreSales || m.totalSales,
      numericValue: store.totalStoreSales || m.totalSales,
      status: 'neutral',
    },
    { label: 'ACOS', value: acos, numericValue: acos, status: acos > 30 ? 'bad' : acos < 20 ? 'good' : 'warn' },
    { label: 'ROAS', value: roas, numericValue: roas, status: roas >= 3 ? 'good' : roas < 1.5 ? 'bad' : 'warn' },
    { label: 'TACOS', value: tacos, numericValue: tacos, status: 'neutral' },
    { label: 'Clicks', value: totalClicks, numericValue: totalClicks, status: 'neutral' },
    { label: 'CPC', value: cpc, numericValue: cpc, status: 'neutral' },
    { label: 'Sessions', value: store.totalSessions, numericValue: store.totalSessions, status: 'neutral' },
    { label: 'Buy Box %', value: store.buyBoxPercent, numericValue: store.buyBoxPercent, status: 'neutral' },
    { label: 'Units Ordered', value: store.totalUnitsOrdered, numericValue: store.totalUnitsOrdered, status: 'neutral' },
    { label: 'Conversion Rate', value: m.conversionRate, numericValue: m.conversionRate, status: 'neutral' },
  ];
}

function buildSlmTables(store: MemoryStore): TableArtifact[] {
  const campaigns = Object.values(store.campaignMetrics)
    .filter((c) => c.campaignName)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 25);
  const kws = Object.values(store.keywordMetrics)
    .filter((k) => k.sales > 0)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 30);
  const waste = Object.values(store.keywordMetrics)
    .filter((k) => k.clicks >= 10 && k.sales === 0)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 20);
  const asins = Object.values(store.asinMetrics)
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 20);
  return [
    {
      id: 'campaigns-by-spend',
      title: 'Top campaigns by spend',
      columns: [{ key: 'campaignName', label: 'Campaign' }, { key: 'spend', label: 'Spend', align: 'right' }, { key: 'sales', label: 'Sales', align: 'right' }, { key: 'acos', label: 'ACOS', align: 'right' }],
      rows: campaigns.map((c) => ({ campaignName: c.campaignName, spend: c.spend, sales: c.sales, acos: c.acos })),
    },
    {
      id: 'keywords-by-revenue',
      title: 'Top keywords by revenue',
      columns: [{ key: 'searchTerm', label: 'Keyword' }, { key: 'sales', label: 'Sales', align: 'right' }, { key: 'spend', label: 'Spend', align: 'right' }, { key: 'roas', label: 'ROAS', align: 'right' }],
      rows: kws.map((k) => ({ searchTerm: k.searchTerm.slice(0, 40), sales: k.sales, spend: k.spend, roas: k.roas })),
    },
    {
      id: 'waste-keywords',
      title: 'Waste keywords (10+ clicks, 0 sales)',
      columns: [{ key: 'searchTerm', label: 'Keyword' }, { key: 'spend', label: 'Spend', align: 'right' }, { key: 'clicks', label: 'Clicks', align: 'right' }],
      rows: waste.map((k) => ({ searchTerm: k.searchTerm.slice(0, 40), spend: k.spend, clicks: k.clicks })),
    },
    {
      id: 'asins-by-sales',
      title: 'Top ASINs by sales',
      columns: [{ key: 'asin', label: 'ASIN' }, { key: 'totalSales', label: 'Sales', align: 'right' }, { key: 'adSpend', label: 'Ad Spend', align: 'right' }],
      rows: asins.map((a) => ({ asin: a.asin, totalSales: a.totalSales, adSpend: a.adSpend })),
    },
  ];
}

function buildSlmCharts(store: MemoryStore): ChartArtifact[] {
  const campaigns = Object.values(store.campaignMetrics)
    .filter((c) => c.campaignName)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);
  const byMatch = new Map<string, { spend: number; sales: number }>();
  Object.values(store.keywordMetrics).forEach((k) => {
    const mt = (k.matchType || 'other').toLowerCase();
    const cur = byMatch.get(mt) || { spend: 0, sales: 0 };
    cur.spend += k.spend;
    cur.sales += k.sales;
    byMatch.set(mt, cur);
  });
  const totalSales = store.totalStoreSales || store.storeMetrics.totalSales;
  const adSales = store.totalAdSales;
  const organic = Math.max(0, totalSales - adSales);
  return [
    {
      id: 'spend-by-campaign',
      title: 'Spend by campaign',
      type: 'bar',
      data: [{ name: 'Spend', labels: campaigns.map((c) => c.campaignName || ''), values: campaigns.map((c) => c.spend) }],
      tableRef: 'campaigns-by-spend',
    },
    {
      id: 'roas-by-campaign',
      title: 'ROAS by campaign',
      type: 'bar',
      data: [{ name: 'ROAS', labels: campaigns.map((c) => c.campaignName || ''), values: campaigns.map((c) => c.spend > 0 ? c.sales / c.spend : 0) }],
    },
    {
      id: 'sales-breakdown',
      title: 'Sales breakdown',
      type: 'pie',
      data: [{ name: 'Sales', labels: ['Ad Sales', 'Organic'], values: [adSales, organic] }],
    },
    {
      id: 'match-type-spend',
      title: 'Spend by match type',
      type: 'bar',
      data: [{ name: 'Spend', labels: Array.from(byMatch.keys()), values: Array.from(byMatch.values()).map((v) => v.spend) }],
    },
  ];
}

function buildSlmInsights(store: MemoryStore): InsightArtifact[] {
  const diagnostics = runDiagnosticEngines(store);
  const sanity = runSanityChecks(store);
  const insights: InsightArtifact[] = [];
  if (diagnostics.waste.bleedingKeywords.length > 0) {
    insights.push({
      id: 'waste-bleed',
      title: 'Wasted spend (zero-sales keywords)',
      description: `${diagnostics.waste.bleedingKeywords.length} keywords with spend and no sales. Estimated waste: ${diagnostics.waste.totalWasteSpend.toFixed(2)}.`,
      severity: 'critical',
      recommendedAction: 'Pause or add as negatives.',
    });
  }
  sanity.scalingKeywords.slice(0, 5).forEach((k, i) => {
    insights.push({
      id: `scale-${i}`,
      title: 'Scaling opportunity',
      description: `Keyword "${k.searchTerm}" has ROAS ${k.roas.toFixed(2)} with low spend.`,
      severity: 'opportunity',
      recommendedAction: 'Increase budget/bids.',
      entityName: k.searchTerm,
      entityType: 'keyword',
    });
  });
  sanity.highACOSCampaigns.slice(0, 3).forEach((c, i) => {
    insights.push({
      id: `high-acos-${i}`,
      title: 'High ACOS campaign',
      description: `Campaign "${c.campaignName}" has ACOS ${c.acos.toFixed(1)}%.`,
      severity: 'warning',
      recommendedAction: 'Reduce bids or add negatives.',
      entityName: c.campaignName,
      entityType: 'campaign',
    });
  });
  return insights;
}

/** Build full SLM artifact set from normalized store. */
export function buildSlmArtifacts(store: MemoryStore): EngineArtifacts {
  return {
    metrics: buildSlmMetrics(store),
    tables: buildSlmTables(store),
    charts: buildSlmCharts(store),
    insights: buildSlmInsights(store),
  };
}
