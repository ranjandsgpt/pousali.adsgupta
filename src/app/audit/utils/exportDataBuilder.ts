/**
 * Builds full audit data for PDF/Word export: KPIs, patterns, opportunities,
 * all tables from all tabs, and chart datasets (as data tables for export).
 * Excludes Gemini narrative; includes everything else from the UI.
 */

import type { MemoryStore } from './reportParser';
import { formatCurrency, formatPercent } from './formatNumber';
import { getCurrencySymbol } from './currencyDetector';
import { runSanityChecks } from '../utils/sanityChecks';
import { executeMetricEngineForStore } from '@/services/metricExecutionEngine';
import type { OverrideState } from '@/services/overrideEngine';

export interface ExportTable {
  section: string;
  title: string;
  columns: { key: string; label: string; align?: 'left' | 'right' }[];
  rows: Record<string, string | number>[];
}

export interface ExportChartData {
  id: string;
  title: string;
  type: 'bar' | 'pie';
  /** For bar: labels (categories) and values. For pie: name + value pairs */
  labels?: string[];
  values?: number[];
  data?: { name: string; value: number }[];
}

export interface FullExportData {
  title: string;
  generatedAt: string;
  kpis: { label: string; value: string }[];
  patterns: { problemTitle: string; entityName: string; recommendedAction: string; metricValues?: string }[];
  opportunities: { title: string; entityName: string; recommendedAction: string; metricValues?: string }[];
  tables: ExportTable[];
  chartDatasets: ExportChartData[];
}

function buildKpis(store: MemoryStore, overrides?: OverrideState): { label: string; value: string }[] {
  const canonical = executeMetricEngineForStore(store, overrides);
  const totalClicks = canonical.totalClicks > 0 ? canonical.totalClicks : store.totalClicks || Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);
  const sym = getCurrencySymbol(store.currency) || '$';
  return [
    { label: 'Total Ad Spend', value: `${sym}${canonical.totalAdSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
    { label: 'Total Ad Sales', value: `${sym}${canonical.totalAdSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
    { label: 'Total Store Sales', value: `${sym}${canonical.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
    { label: 'ACOS', value: formatPercent(canonical.acos * 100) },
    { label: 'ROAS', value: `${canonical.roas.toFixed(2)}×` },
    { label: 'TACOS', value: formatPercent(canonical.tacos * 100) },
    { label: 'Clicks', value: String(totalClicks) },
    { label: 'Orders', value: String(canonical.totalOrders) },
    { label: 'Sessions', value: store.totalSessions > 0 ? String(store.totalSessions) : '—' },
    { label: 'Organic Sales', value: `${sym}${canonical.organicSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
  ];
}

function buildPatterns(store: MemoryStore): FullExportData['patterns'] {
  const out: FullExportData['patterns'] = [];
  const campaigns = Object.values(store.campaignMetrics);
  const keywords = Object.values(store.keywordMetrics);
  campaigns.filter((c) => c.acos > 60 && c.sales > 0).slice(0, 10).forEach((c) => {
    out.push({
      problemTitle: 'High ACOS Campaign',
      entityName: c.campaignName || '—',
      recommendedAction: 'Reduce bids or add negatives.',
      metricValues: `ACOS ${c.acos.toFixed(1)}%, Spend ${c.spend.toFixed(2)}`,
    });
  });
  keywords.filter((k) => k.spend > 50 && k.sales === 0).sort((a, b) => b.spend - a.spend).slice(0, 10).forEach((k) => {
    out.push({
      problemTitle: 'Bleeding Keyword',
      entityName: k.searchTerm.slice(0, 40),
      recommendedAction: 'Pause or add as negative.',
      metricValues: `Spend ${k.spend.toFixed(2)}, Clicks ${k.clicks}`,
    });
  });
  keywords.filter((k) => k.roas >= 4 && k.sales > 0).slice(0, 5).forEach((k) => {
    out.push({
      problemTitle: 'Scaling Opportunity',
      entityName: k.searchTerm.slice(0, 40),
      recommendedAction: 'Increase budget/bids.',
      metricValues: `ROAS ${k.roas.toFixed(2)}`,
    });
  });
  return out;
}

function buildOpportunities(store: MemoryStore): FullExportData['opportunities'] {
  const out: FullExportData['opportunities'] = [];
  const campaigns = Object.values(store.campaignMetrics).filter((c) => c.sales > 0 && c.spend > 0);
  const avgSpend = campaigns.length ? campaigns.reduce((s, c) => s + c.spend, 0) / campaigns.length : 0;
  campaigns
    .filter((c) => c.sales / c.spend >= 3 && c.spend < avgSpend)
    .sort((a, b) => (b.sales / b.spend) - (a.sales / a.spend))
    .slice(0, 10)
    .forEach((c) => {
      out.push({
        title: 'High ROAS, low spend',
        entityName: c.campaignName || '—',
        recommendedAction: 'Scale budget.',
        metricValues: `ROAS ${(c.sales / c.spend).toFixed(2)}`,
      });
    });
  return out;
}

function buildTables(store: MemoryStore): ExportTable[] {
  const tables: ExportTable[] = [];
  const sym = getCurrencySymbol(store.currency) || '$';

  const campaigns = Object.values(store.campaignMetrics).filter((c) => c.campaignName).sort((a, b) => b.spend - a.spend);
  if (campaigns.length > 0) {
    tables.push({
      section: 'Campaigns',
      title: 'Top campaigns by spend',
      columns: [{ key: 'campaignName', label: 'Campaign' }, { key: 'spend', label: 'Spend', align: 'right' }, { key: 'sales', label: 'Sales', align: 'right' }, { key: 'acos', label: 'ACOS', align: 'right' }],
      rows: campaigns.slice(0, 25).map((c) => ({
        campaignName: c.campaignName || '',
        spend: c.spend,
        sales: c.sales,
        acos: c.acos,
      })),
    });
  }

  const kws = Object.values(store.keywordMetrics).filter((k) => k.sales > 0).sort((a, b) => b.sales - a.sales);
  if (kws.length > 0) {
    tables.push({
      section: 'Keywords',
      title: 'Top keywords by revenue',
      columns: [{ key: 'searchTerm', label: 'Keyword' }, { key: 'sales', label: 'Sales', align: 'right' }, { key: 'spend', label: 'Spend', align: 'right' }, { key: 'roas', label: 'ROAS', align: 'right' }],
      rows: kws.slice(0, 30).map((k) => ({
        searchTerm: k.searchTerm.slice(0, 45),
        sales: k.sales,
        spend: k.spend,
        roas: k.roas,
      })),
    });
  }

  const waste = Object.values(store.keywordMetrics).filter((k) => k.clicks >= 10 && k.sales === 0).sort((a, b) => b.spend - a.spend);
  if (waste.length > 0) {
    tables.push({
      section: 'Waste & Bleed',
      title: 'Keywords with spend and zero sales (10+ clicks)',
      columns: [{ key: 'searchTerm', label: 'Keyword' }, { key: 'spend', label: 'Spend', align: 'right' }, { key: 'clicks', label: 'Clicks', align: 'right' }],
      rows: waste.slice(0, 25).map((k) => ({
        searchTerm: k.searchTerm.slice(0, 45),
        spend: k.spend,
        clicks: k.clicks,
      })),
    });
  }

  const asins = Object.values(store.asinMetrics).sort((a, b) => b.totalSales - a.totalSales);
  if (asins.length > 0) {
    tables.push({
      section: 'ASINs',
      title: 'Top ASINs by sales',
      columns: [{ key: 'asin', label: 'ASIN' }, { key: 'totalSales', label: 'Sales', align: 'right' }, { key: 'adSpend', label: 'Ad Spend', align: 'right' }, { key: 'acos', label: 'ACOS', align: 'right' }],
      rows: asins.slice(0, 25).map((a) => ({
        asin: a.asin,
        totalSales: a.totalSales,
        adSpend: a.adSpend,
        acos: a.acos,
      })),
    });
  }

  const m = store.storeMetrics;
  tables.push({
    section: 'Account',
    title: 'Account profitability & efficiency',
    columns: [{ key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value', align: 'right' }],
    rows: [
      { metric: 'TACOS', value: `${m.tacos.toFixed(1)}%` },
      { metric: 'ROAS', value: m.roas.toFixed(2) },
      { metric: 'Organic Sales', value: `${sym}${m.organicSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
      { metric: 'Contribution Margin', value: `${sym}${m.contributionMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
      { metric: '7d Attributed Sales', value: m.attributedSales7d > 0 ? `${sym}${m.attributedSales7d.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—' },
      { metric: '14d Attributed Sales', value: m.attributedSales14d > 0 ? `${sym}${m.attributedSales14d.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—' },
    ],
  });

  const sanity = runSanityChecks(store);
  if (sanity.highACOSCampaigns.length > 0) {
    tables.push({
      section: 'Alerts',
      title: 'High ACOS campaigns',
      columns: [{ key: 'campaignName', label: 'Campaign' }, { key: 'acos', label: 'ACOS', align: 'right' }, { key: 'spend', label: 'Spend', align: 'right' }],
      rows: sanity.highACOSCampaigns.slice(0, 15).map((c) => ({
        campaignName: c.campaignName,
        acos: c.acos,
        spend: c.spend,
      })),
    });
  }
  if (sanity.scalingKeywords.length > 0) {
    tables.push({
      section: 'Opportunities',
      title: 'Scaling keywords (high ROAS)',
      columns: [{ key: 'keyword', label: 'Keyword' }, { key: 'spend', label: 'Spend', align: 'right' }, { key: 'sales', label: 'Sales', align: 'right' }, { key: 'roas', label: 'ROAS', align: 'right' }],
      rows: sanity.scalingKeywords.slice(0, 15).map((k) => ({
        keyword: k.searchTerm.slice(0, 40),
        spend: k.spend,
        sales: k.sales,
        roas: k.roas.toFixed(2),
      })),
    });
  }

  return tables;
}

function buildChartDatasets(store: MemoryStore, overrides?: OverrideState): ExportChartData[] {
  const charts: ExportChartData[] = [];
  const campaigns = Object.values(store.campaignMetrics).filter((c) => c.campaignName).sort((a, b) => b.spend - a.spend).slice(0, 10);
  if (campaigns.length > 0) {
    charts.push({
      id: 'spend-by-campaign',
      title: 'Spend by campaign (top 10)',
      type: 'bar',
      labels: campaigns.map((c) => (c.campaignName || '').slice(0, 20)),
      values: campaigns.map((c) => c.spend),
    });
    charts.push({
      id: 'roas-by-campaign',
      title: 'ROAS by campaign (top 10)',
      type: 'bar',
      labels: campaigns.map((c) => (c.campaignName || '').slice(0, 20)),
      values: campaigns.map((c) => c.spend > 0 ? c.sales / c.spend : 0),
    });
  }

  const byMatch: Record<string, number> = {};
  Object.values(store.keywordMetrics).forEach((k) => {
    const m = (k.matchType || 'other').toLowerCase();
    byMatch[m] = (byMatch[m] ?? 0) + k.spend;
  });
  if (Object.keys(byMatch).length > 0) {
    charts.push({
      id: 'match-type-spend',
      title: 'Spend by match type',
      type: 'pie',
      data: Object.entries(byMatch).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })),
    });
  }

  const waste = Object.values(store.keywordMetrics).filter((k) => k.clicks >= 10 && k.sales === 0).sort((a, b) => b.spend - a.spend).slice(0, 10);
  if (waste.length > 0) {
    charts.push({
      id: 'wasted-spend',
      title: 'Wasted spend (top 10 zero-sales keywords)',
      type: 'bar',
      labels: waste.map((k) => k.searchTerm.slice(0, 25)),
      values: waste.map((k) => k.spend),
    });
  }

  const canonical = executeMetricEngineForStore(store, overrides);
  const totalSales = canonical.totalSales;
  const adSales = canonical.totalAdSales;
  const organic = canonical.organicSales;
  if (totalSales > 0) {
    charts.push({
      id: 'organic-vs-ad',
      title: 'Sales breakdown: Ad vs Organic',
      type: 'pie',
      data: [
        { name: 'Ad Sales', value: adSales },
        { name: 'Organic', value: organic },
      ],
    });
  }

  return charts;
}

export function buildFullExportData(store: MemoryStore, overrides?: OverrideState): FullExportData {
  const hasData = store.totalAdSpend > 0 || store.totalStoreSales > 0;
  return {
    title: 'Amazon Advertising Performance Audit',
    generatedAt: new Date().toLocaleString(),
    kpis: hasData ? buildKpis(store, overrides) : [],
    patterns: hasData ? buildPatterns(store) : [],
    opportunities: hasData ? buildOpportunities(store) : [],
    tables: hasData ? buildTables(store) : [],
    chartDatasets: hasData ? buildChartDatasets(store, overrides) : [],
  };
}
