'use client';

import { useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { formatCurrency, formatPercent } from '../utils/formatNumber';
import type { TabConfig, KPIMetric, PatternDetection, OpportunityDetection, TabTableConfig } from './types';
import type { MemoryStore } from '../utils/reportParser';
import type { DetectedCurrency } from '../utils/currencyDetector';

export type TabId =
  | 'overview'
  | 'account-health'
  | 'campaign-intelligence'
  | 'keyword-intelligence'
  | 'search-term-intelligence'
  | 'negative-keyword-engine'
  | 'budget-optimization'
  | 'bid-optimization'
  | 'asin-performance'
  | 'profitability-analysis'
  | 'inventory-intelligence'
  | 'market-signals'
  | 'structural-audit'
  | 'waste-detection'
  | 'growth-opportunities'
  | 'predictive-forecasting'
  | 'learning-intelligence'
  | 'ai-strategy-engine'
  | 'charts-lab';

function buildKPIs(store: MemoryStore): KPIMetric[] {
  const m = store.storeMetrics;
  const acos = store.totalAdSales > 0 ? (store.totalAdSpend / store.totalAdSales) * 100 : 0;
  const totalClicks = Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);
  const totalOrders = store.totalOrders || 0;
  const ctr = totalClicks > 0 ? (totalClicks / Math.max(totalClicks * 50, 1)) * 100 : 0;
  const cvr = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;
  const cpc = totalClicks > 0 ? store.totalAdSpend / totalClicks : 0;
  const sym = store.currency ? formatCurrency(0, store.currency).replace('0.00', '') : '$';
  return [
    { label: 'Spend', value: `${sym}${store.totalAdSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, status: store.totalAdSpend > 0 ? 'neutral' : undefined },
    { label: 'Sales', value: `${sym}${(store.totalAdSales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, status: 'neutral' },
    { label: 'ACOS', value: formatPercent(acos), status: acos > 30 ? 'bad' : acos < 20 ? 'good' : 'warn' },
    { label: 'ROAS', value: `${m.roas.toFixed(2)}×`, status: m.roas >= 3 ? 'good' : m.roas < 1.5 ? 'bad' : 'warn' },
    { label: 'TACOS', value: formatPercent(m.tacos), status: m.tacos > 25 ? 'bad' : 'good' },
    { label: 'CTR', value: formatPercent(ctr), status: 'neutral' },
    { label: 'CVR', value: formatPercent(cvr), status: cvr >= 8 ? 'good' : cvr < 3 ? 'warn' : 'neutral' },
    { label: 'Orders', value: String(totalOrders), status: 'neutral' },
    { label: 'CPC', value: `${sym}${cpc.toFixed(2)}`, status: 'neutral' },
  ];
}

function buildPatterns(store: MemoryStore): PatternDetection[] {
  const out: PatternDetection[] = [];
  const campaigns = Object.values(store.campaignMetrics);
  const keywords = Object.values(store.keywordMetrics);
  campaigns
    .filter((c) => c.acos > 60 && c.sales > 0)
    .slice(0, 10)
    .forEach((c) =>
      out.push({
        problemTitle: 'High ACOS Campaign',
        entityType: 'campaign',
        entityName: c.campaignName || '—',
        metricValues: { ACOS: c.acos, Spend: c.spend, Sales: c.sales },
        estimatedImpact: `~${formatPercent(c.acos - 25)} above target`,
        recommendedAction: 'Reduce bids or add negatives; optimize targeting.',
      })
    );
  keywords
    .filter((k) => k.spend > 50 && k.sales === 0)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10)
    .forEach((k) =>
      out.push({
        problemTitle: 'Bleeding Keyword',
        entityType: 'keyword',
        entityName: k.searchTerm,
        metricValues: { Spend: k.spend, Clicks: k.clicks },
        estimatedImpact: `€${k.spend.toFixed(0)} wasted`,
        recommendedAction: 'Pause or add as negative.',
      })
    );
  keywords
    .filter((k) => k.clicks >= 10 && k.sales > 0)
    .filter((k) => {
      const ctr = k.clicks / Math.max(k.clicks * 30, 1) * 100;
      const cvr = (1 / k.clicks) * 100;
      return ctr > 2 && cvr < 3;
    })
    .slice(0, 5)
    .forEach((k) =>
      out.push({
        problemTitle: 'Listing Conversion Problem',
        entityType: 'keyword',
        entityName: k.searchTerm,
        metricValues: { CTR: '>2%', CVR: '<3%' },
        recommendedAction: 'Improve listing conversion; check images and copy.',
      })
    );
  const avgSpend = keywords.length > 0 ? keywords.reduce((s, k) => s + k.spend, 0) / keywords.length : 0;
  keywords
    .filter((k) => k.roas >= 4 && k.spend < avgSpend * 0.5 && k.sales > 0)
    .slice(0, 5)
    .forEach((k) =>
      out.push({
        problemTitle: 'Scaling Opportunity',
        entityType: 'keyword',
        entityName: k.searchTerm,
        metricValues: { ROAS: k.roas.toFixed(2), Spend: k.spend },
        recommendedAction: 'Increase budget/bids to scale.',
      })
    );
  return out;
}

function buildOpportunities(store: MemoryStore): OpportunityDetection[] {
  const out: OpportunityDetection[] = [];
  const campaigns = Object.values(store.campaignMetrics).filter((c) => c.sales > 0 && c.spend > 0);
  const avgSpend = campaigns.length ? campaigns.reduce((s, c) => s + c.spend, 0) / campaigns.length : 0;
  campaigns
    .filter((c) => c.sales / c.spend >= 3 && c.spend < avgSpend)
    .sort((a, b) => b.sales / b.spend - a.sales / a.spend)
    .slice(0, 10)
    .forEach((c) =>
      out.push({
        title: 'High ROAS, low spend',
        entityName: c.campaignName || '—',
        entityType: 'campaign',
        metricValues: { ROAS: (c.sales / c.spend).toFixed(2), Spend: c.spend },
        recommendedAction: 'Scale budget.',
      })
    );
  const keywords = Object.values(store.keywordMetrics).filter((k) => k.sales > 0 && k.acos > 0 && k.acos < 15);
  keywords.slice(0, 10).forEach((k) =>
    out.push({
      title: 'Low ACOS keyword',
      entityName: k.searchTerm,
      entityType: 'keyword',
      metricValues: { ACOS: k.acos.toFixed(1), ROAS: k.roas.toFixed(2) },
      recommendedAction: 'Scale.',
    })
  );
  return out;
}

function campaignTables(store: MemoryStore, currency: DetectedCurrency): TabTableConfig[] {
  const campaigns = Object.values(store.campaignMetrics)
    .filter((c) => c.campaignName)
    .sort((a, b) => b.spend - a.spend);
  const byRevenue = [...campaigns].sort((a, b) => b.sales - a.sales);
  const worstAcos = [...campaigns].filter((c) => c.spend > 0).sort((a, b) => b.acos - a.acos);
  const bestRoas = [...campaigns].filter((c) => c.spend > 0).sort((a, b) => (b.sales / b.spend) - (a.sales / a.spend));
  const fmt = (n: number) => (currency ? formatCurrency(n, currency) : n.toFixed(2));
  return [
    {
      title: 'Top 20 campaigns by spend',
      columns: [
        { key: 'campaignName', label: 'Campaign' },
        { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
        { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
        { key: 'acos', label: 'ACOS', align: 'right', format: 'percent' },
      ],
      rows: campaigns.slice(0, 20).map((c) => ({ campaignName: c.campaignName, spend: c.spend, sales: c.sales, acos: c.acos })),
    },
    {
      title: 'Top 20 campaigns by revenue',
      columns: [
        { key: 'campaignName', label: 'Campaign' },
        { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
        { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
        { key: 'roas', label: 'ROAS', align: 'right' },
      ],
      rows: byRevenue.slice(0, 20).map((c) => ({ campaignName: c.campaignName, sales: c.sales, spend: c.spend, roas: c.spend > 0 ? (c.sales / c.spend).toFixed(2) : '—' })),
    },
    {
      title: 'Worst ACOS campaigns',
      columns: [
        { key: 'campaignName', label: 'Campaign' },
        { key: 'acos', label: 'ACOS', align: 'right', format: 'percent' },
        { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
      ],
      rows: worstAcos.slice(0, 20).map((c) => ({ campaignName: c.campaignName, acos: c.acos, spend: c.spend })),
    },
    {
      title: 'Best ROAS campaigns',
      columns: [
        { key: 'campaignName', label: 'Campaign' },
        { key: 'roas', label: 'ROAS', align: 'right' },
        { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
      ],
      rows: bestRoas.slice(0, 20).map((c) => ({ campaignName: c.campaignName, roas: (c.sales / c.spend).toFixed(2), sales: c.sales })),
    },
  ];
}

function keywordTables(store: MemoryStore): TabTableConfig[] {
  const kws = Object.values(store.keywordMetrics);
  const profitable = kws.filter((k) => k.sales > 0).sort((a, b) => b.sales - a.sales).slice(0, 20);
  const waste = kws.filter((k) => k.clicks >= 10 && k.sales === 0).sort((a, b) => b.spend - a.spend).slice(0, 20);
  return [
    {
      title: 'Top 20 profitable keywords',
      columns: [
        { key: 'searchTerm', label: 'Keyword' },
        { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
        { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
        { key: 'roas', label: 'ROAS', align: 'right' },
      ],
      rows: profitable.map((k) => ({ searchTerm: k.searchTerm.slice(0, 40), sales: k.sales, spend: k.spend, roas: k.roas.toFixed(2) })),
    },
    {
      title: 'Top 20 waste keywords',
      columns: [
        { key: 'searchTerm', label: 'Keyword' },
        { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
        { key: 'clicks', label: 'Clicks', align: 'right' },
      ],
      rows: waste.map((k) => ({ searchTerm: k.searchTerm.slice(0, 40), spend: k.spend, clicks: k.clicks })),
    },
  ];
}

function searchTermTables(store: MemoryStore): TabTableConfig[] {
  const kws = Object.values(store.keywordMetrics);
  const byRevenue = [...kws].filter((k) => k.sales > 0).sort((a, b) => b.sales - a.sales).slice(0, 50);
  const waste = kws.filter((k) => k.clicks >= 5 && k.sales === 0).sort((a, b) => b.spend - a.spend).slice(0, 30);
  const highCvr = kws.filter((k) => k.clicks >= 10 && k.sales > 0).sort((a, b) => (b.sales / b.clicks) - (a.sales / a.clicks)).slice(0, 20);
  return [
    { title: 'Top 50 search terms by revenue', columns: [{ key: 'searchTerm', label: 'Search Term' }, { key: 'sales', label: 'Sales', align: 'right', format: 'currency' }, { key: 'spend', label: 'Spend', align: 'right', format: 'currency' }], rows: byRevenue.map((k) => ({ searchTerm: k.searchTerm, sales: k.sales, spend: k.spend })) },
    { title: 'Top waste search terms', columns: [{ key: 'searchTerm', label: 'Search Term' }, { key: 'spend', label: 'Spend', align: 'right', format: 'currency' }, { key: 'clicks', label: 'Clicks', align: 'right' }], rows: waste.map((k) => ({ searchTerm: k.searchTerm, spend: k.spend, clicks: k.clicks })) },
    { title: 'High conversion search terms', columns: [{ key: 'searchTerm', label: 'Search Term' }, { key: 'sales', label: 'Sales', align: 'right', format: 'currency' }, { key: 'clicks', label: 'Clicks', align: 'right' }], rows: highCvr.map((k) => ({ searchTerm: k.searchTerm, sales: k.sales, clicks: k.clicks })) },
  ];
}

function negativeKeywordTable(store: MemoryStore): TabTableConfig[] {
  const rows = Object.values(store.keywordMetrics)
    .filter((k) => k.clicks >= 5 && k.sales === 0)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 50)
    .map((k) => ({
      searchTerm: k.searchTerm,
      spend: k.spend,
      clicks: k.clicks,
      matchType: k.matchType,
      suggestedNegative: k.matchType?.toLowerCase().includes('broad') ? 'phrase/exact' : 'exact',
    }));
  return [
    {
      title: 'Suggested negatives (waste queries)',
      columns: [
        { key: 'searchTerm', label: 'Search Term' },
        { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
        { key: 'clicks', label: 'Clicks', align: 'right' },
        { key: 'matchType', label: 'Match Type' },
        { key: 'suggestedNegative', label: 'Suggested negative type' },
      ],
      rows,
    },
  ];
}

export function useTabData(tabId: TabId): TabConfig & { currency: DetectedCurrency } {
  const { state } = useAuditStore();
  const store = state.store;
  const currency = store.currency;

  return useMemo(() => {
    const kpis = buildKPIs(store);
    const patterns = buildPatterns(store);
    const opportunities = buildOpportunities(store);
    const hasData = store.totalAdSpend > 0 || store.totalStoreSales > 0;

    const emptyTables: TabTableConfig[] = [];
    let tables: TabTableConfig[] = emptyTables;
    if (tabId === 'campaign-intelligence') tables = campaignTables(store, currency);
    if (tabId === 'keyword-intelligence') tables = keywordTables(store);
    if (tabId === 'search-term-intelligence') tables = searchTermTables(store);
    if (tabId === 'negative-keyword-engine') tables = negativeKeywordTable(store);
    if (tabId === 'overview' || tabId === 'account-health') {
      tables = [
        { title: 'Top 20 campaigns by spend', columns: [{ key: 'name', label: 'Campaign' }, { key: 'spend', label: 'Spend', align: 'right', format: 'currency' }], rows: Object.values(store.campaignMetrics).sort((a, b) => b.spend - a.spend).slice(0, 20).map((c) => ({ name: c.campaignName, spend: c.spend })) },
      ];
    }
    if (tabId === 'asin-performance') {
      tables = [
        { title: 'ASIN performance', columns: [{ key: 'asin', label: 'ASIN' }, { key: 'adSales', label: 'Ad Sales', align: 'right', format: 'currency' }, { key: 'adSpend', label: 'Ad Spend', align: 'right', format: 'currency' }, { key: 'acos', label: 'ACOS', align: 'right', format: 'percent' }], rows: Object.values(store.asinMetrics).slice(0, 20).map((a) => ({ asin: a.asin, adSales: a.adSales, adSpend: a.adSpend, acos: a.acos })) },
      ];
    }
    if (tabId === 'waste-detection') tables = [{ title: 'Top waste keywords', columns: [{ key: 'searchTerm', label: 'Keyword' }, { key: 'spend', label: 'Spend', align: 'right', format: 'currency' }], rows: Object.values(store.keywordMetrics).filter((k) => k.clicks >= 10 && k.sales === 0).sort((a, b) => b.spend - a.spend).slice(0, 20).map((k) => ({ searchTerm: k.searchTerm, spend: k.spend })) }];
    if (tabId === 'growth-opportunities') tables = [{ title: 'High ROAS keywords', columns: [{ key: 'searchTerm', label: 'Keyword' }, { key: 'roas', label: 'ROAS', align: 'right' }, { key: 'spend', label: 'Spend', align: 'right', format: 'currency' }], rows: Object.values(store.keywordMetrics).filter((k) => k.roas >= 4).sort((a, b) => b.roas - a.roas).slice(0, 20).map((k) => ({ searchTerm: k.searchTerm, roas: k.roas.toFixed(2), spend: k.spend })) }];
    if (tabId === 'budget-optimization')
      tables = [{ title: 'Campaign budget utilization', columns: [{ key: 'campaignName', label: 'Campaign' }, { key: 'budget', label: 'Budget', align: 'right', format: 'currency' }, { key: 'spend', label: 'Spend', align: 'right', format: 'currency' }], rows: Object.values(store.campaignMetrics).filter((c) => c.campaignName).slice(0, 20).map((c) => ({ campaignName: c.campaignName, budget: c.budget, spend: c.spend })) }];
    if (tabId === 'profitability-analysis')
      tables = [{ title: 'Account profitability', columns: [{ key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value', align: 'right' }], rows: [{ metric: 'True TACOS', value: `${store.storeMetrics.tacos.toFixed(1)}%` }, { metric: 'ROAS', value: store.storeMetrics.roas.toFixed(2) }, { metric: 'Organic share', value: `${(store.storeMetrics.organicSales && store.totalStoreSales ? (store.storeMetrics.organicSales / store.totalStoreSales) * 100 : 0).toFixed(1)}%` }] }];
    if (tabId === 'structural-audit')
      tables = [{ title: 'Campaign structure', columns: [{ key: 'name', label: 'Campaign' }, { key: 'kwCount', label: 'Keyword count', align: 'right' }], rows: Object.entries(store.campaignMetrics).slice(0, 20).map(([name, c]) => ({ name: c.campaignName || name, kwCount: Object.values(store.keywordMetrics).filter((k) => k.campaign === (c.campaignName || name)).length })) }];

    const chartIds: string[] = [];
    if (['overview', 'account-health', 'campaign-intelligence', 'charts-lab'].includes(tabId))
      chartIds.push('spend-by-campaign', 'roas-by-campaign', 'acos-heatmap', 'pareto-spend', 'spend-vs-conversion', 'wasted-spend');
    if (['keyword-intelligence', 'charts-lab'].includes(tabId))
      chartIds.push('keyword-scatter', 'match-type-spend', 'ad-product-sales');
    if (['search-term-intelligence', 'charts-lab'].includes(tabId)) chartIds.push('search-term-waste');
    if (['profitability-analysis', 'charts-lab'].includes(tabId)) chartIds.push('organic-vs-ad', 'tacos-gauge');
    if (['budget-optimization', 'charts-lab'].includes(tabId)) chartIds.push('budget-pacing');
    if (tabId === 'charts-lab') {
      chartIds.push(
        'daily-trend', 'spend-by-campaign', 'roas-by-campaign', 'acos-heatmap', 'pareto-spend', 'spend-vs-conversion', 'wasted-spend',
        'match-type-spend', 'ad-product-sales', 'organic-vs-ad', 'budget-pacing', 'daily-trend'
      );
    }

    return {
      kpis: hasData ? kpis : [],
      patterns: hasData ? patterns : [],
      opportunities: hasData ? opportunities : [],
      tables: hasData ? tables : [],
      chartIds,
      currency,
    };
  }, [store, tabId, currency]);
}
