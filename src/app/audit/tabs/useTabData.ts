'use client';

import { useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { formatCurrency, formatPercent } from '../utils/formatNumber';
import type { TabConfig, KPIMetric, PatternDetection, OpportunityDetection, TabTableConfig, InsightModule, DeepDiveTableConfig } from './types';
import type { MemoryStore } from '../utils/reportParser';
import type { DetectedCurrency } from '../utils/currencyDetector';
import { runDiagnosticEngines, type DiagnosticEnginesResult } from '../engines';

/** 7 primary tabs: distributed analysis, deep-dive modules, reference UX. */
export type TabId =
  | 'overview'
  | 'keywords-search-terms'
  | 'campaigns-budget'
  | 'asins-products'
  | 'waste-bleed'
  | 'profitability-inventory'
  | 'insights-reports';

function buildKPIs(store: MemoryStore): KPIMetric[] {
  const m = store.storeMetrics;
  const acos = store.totalAdSales > 0 ? (store.totalAdSpend / store.totalAdSales) * 100 : 0;
  const totalClicks = store.totalClicks > 0 ? store.totalClicks : Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);
  const totalImpressions = store.totalImpressions || 0;
  const totalOrders = store.totalOrders || 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : totalClicks > 0 ? (totalClicks / Math.max(totalClicks * 50, 1)) * 100 : 0;
  const cvr = m.conversionRate > 0 ? m.conversionRate : totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;
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
    { label: 'Impressions', value: totalImpressions > 0 ? totalImpressions.toLocaleString() : '—', status: 'neutral' },
    { label: 'Sessions', value: store.totalSessions > 0 ? store.totalSessions.toLocaleString() : '—', status: 'neutral' },
    { label: 'Ad Sales %', value: m.adSalesPercent > 0 ? formatPercent(m.adSalesPercent) : '—', status: 'neutral' },
    { label: 'Revenue Concentration (Top 10)', value: m.revenueConcentrationTop10Asin > 0 ? formatPercent(m.revenueConcentrationTop10Asin * 100) : '—', status: 'neutral' },
    { label: '7d Attributed Sales', value: m.attributedSales7d > 0 ? `${sym}${m.attributedSales7d.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—', status: 'neutral' },
    { label: '14d Attributed Sales', value: m.attributedSales14d > 0 ? `${sym}${m.attributedSales14d.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—', status: 'neutral' },
    { label: 'Attributed Units', value: m.attributedUnitsOrdered > 0 ? String(m.attributedUnitsOrdered) : '—', status: 'neutral' },
    { label: 'Attributed CVR', value: m.attributedConversionRate > 0 ? formatPercent(m.attributedConversionRate) : '—', status: 'neutral' },
    { label: 'Contribution Margin', value: m.contributionMargin !== 0 ? `${sym}${m.contributionMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—', status: m.contributionMargin >= 0 ? 'good' : 'bad' },
    { label: 'Break-even ACOS', value: m.breakEvenAcos > 0 ? formatPercent(m.breakEvenAcos) : '—', status: 'neutral' },
    { label: 'Profitability Score', value: m.profitabilityScore !== 0 ? formatPercent(m.profitabilityScore) : '—', status: 'neutral' },
    { label: 'Ad Dependency Ratio', value: m.adDependencyRatio > 0 ? formatPercent(m.adDependencyRatio) : '—', status: 'neutral' },
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

function buildInsightModules(store: MemoryStore, tabId: TabId, diagnostics?: DiagnosticEnginesResult | null): InsightModule[] {
  const sym = store.currency ? formatCurrency(0, store.currency).replace('0.00', '') : '$';
  const modules: InsightModule[] = [];
  const kws = Object.values(store.keywordMetrics);
  const campaigns = Object.values(store.campaignMetrics).filter((c) => c.campaignName);

  if (tabId === 'overview' && diagnostics) {
    modules.push({
      id: 'account-strategy',
      title: 'Account Strategy',
      description: diagnostics.accountStrategy,
      count: 1,
      severity: 'info',
      tableRef: 'account-strategy',
    });
  }

  if (tabId === 'overview') {
    const bleedingKw = kws.filter((k) => k.spend > 50 && k.sales === 0);
    const highAcosCamp = campaigns.filter((c) => c.acos > 60 && c.sales > 0);
    const critical = bleedingKw.length + highAcosCamp.length;
    const wasteTotal = kws.filter((k) => k.clicks >= 10 && k.sales === 0).reduce((s, k) => s + k.spend, 0);
    const oppKw = kws.filter((k) => k.roas >= 4 && k.sales > 0);
    const oppCamp = campaigns.filter((c) => c.sales > 0 && c.spend > 0 && c.sales / c.spend >= 3);
    const oppCount = oppKw.length + oppCamp.length;
    const criticalDeepDive: DeepDiveTableConfig = {
      columns: [
        { key: 'type', label: 'Type' },
        { key: 'name', label: 'Name' },
        { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
        { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
        { key: 'acos', label: 'ACOS', align: 'right', format: 'percent' },
        { key: 'action', label: 'Suggested Action' },
      ],
      rows: [
        ...bleedingKw.sort((a, b) => b.spend - a.spend).map((k) => ({ type: 'Keyword', name: k.searchTerm, spend: k.spend, sales: 0, acos: 0, action: 'Add as negative or Pause' })),
        ...highAcosCamp.sort((a, b) => b.acos - a.acos).map((c) => ({ type: 'Campaign', name: c.campaignName, spend: c.spend, sales: c.sales, acos: c.acos, action: 'Reduce bids or add negatives' })),
      ],
    };
    const opportunitiesDeepDive: DeepDiveTableConfig = {
      columns: [
        { key: 'type', label: 'Type' },
        { key: 'name', label: 'Name' },
        { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
        { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
        { key: 'roas', label: 'ROAS', align: 'right' },
        { key: 'action', label: 'Suggested Action' },
      ],
      rows: [
        ...oppKw.sort((a, b) => b.roas - a.roas).map((k) => ({ type: 'Keyword', name: k.searchTerm, spend: k.spend, sales: k.sales, roas: k.roas.toFixed(2), action: 'Scale bid or budget' })),
        ...oppCamp.sort((a, b) => (b.sales / b.spend) - (a.sales / a.spend)).map((c) => ({ type: 'Campaign', name: c.campaignName, spend: c.spend, sales: c.sales, roas: (c.sales / c.spend).toFixed(2), action: 'Increase budget' })),
      ],
    };
    if (critical > 0) modules.push({ id: 'critical', title: 'Critical Issues', description: 'High ACOS campaigns and bleeding keywords eating into profit.', count: critical, impact: wasteTotal > 0 ? `${sym}${wasteTotal.toFixed(0)} at risk` : undefined, severity: 'critical', tableRef: 'critical', deepDiveTable: criticalDeepDive });
    if (oppCount > 0) modules.push({ id: 'opportunities', title: 'Growth Opportunities', description: 'High ROAS keywords and campaigns ready to scale.', count: oppCount, severity: 'opportunity', tableRef: 'opportunities', deepDiveTable: opportunitiesDeepDive });
  }

  if (tabId === 'keywords-search-terms') {
    const bleeding = kws.filter((k) => k.clicks >= 10 && k.sales === 0);
    const hidden = kws.filter((k) => k.roas >= 4 && k.spend < 100 && k.sales > 0);
    const negCandidates = kws.filter((k) => k.clicks >= 5 && k.sales === 0);
    const bleedingDeepDive: DeepDiveTableConfig = {
      columns: [
        { key: 'keyword', label: 'Keyword' },
        { key: 'campaign', label: 'Campaign' },
        { key: 'clicks', label: 'Clicks', align: 'right' },
        { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
        { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
        { key: 'acos', label: 'ACOS', align: 'right', format: 'percent' },
        { key: 'roas', label: 'ROAS', align: 'right' },
        { key: 'suggestedAction', label: 'Suggested Action' },
      ],
      rows: bleeding.sort((a, b) => b.spend - a.spend).map((k) => ({
        keyword: k.searchTerm,
        campaign: k.campaign,
        clicks: k.clicks,
        spend: k.spend,
        sales: k.sales,
        acos: 0,
        roas: 0,
        suggestedAction: 'Add as negative or Pause',
      })),
    };
    const hiddenDeepDive: DeepDiveTableConfig = {
      columns: [
        { key: 'keyword', label: 'Keyword' },
        { key: 'campaign', label: 'Campaign' },
        { key: 'clicks', label: 'Clicks', align: 'right' },
        { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
        { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
        { key: 'roas', label: 'ROAS', align: 'right' },
        { key: 'conversionRate', label: 'Conversion Rate', align: 'right', format: 'percent' },
        { key: 'scalingSuggestion', label: 'Scaling Suggestion' },
      ],
      rows: hidden.sort((a, b) => b.roas - a.roas).map((k) => ({
        keyword: k.searchTerm,
        campaign: k.campaign,
        clicks: k.clicks,
        spend: k.spend,
        sales: k.sales,
        roas: k.roas,
        conversionRate: k.clicks > 0 ? (k.sales / (k.clicks * 10)) * 100 : 0,
        scalingSuggestion: 'Increase bid or add to high-traffic campaign',
      })),
    };
    const negativesDeepDive: DeepDiveTableConfig = {
      columns: [
        { key: 'searchTerm', label: 'Search Term' },
        { key: 'campaign', label: 'Campaign' },
        { key: 'clicks', label: 'Clicks', align: 'right' },
        { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
        { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
        { key: 'suggestedNegativeMatchType', label: 'Suggested Negative Match Type' },
      ],
      rows: negCandidates.sort((a, b) => b.spend - a.spend).map((k) => ({
        searchTerm: k.searchTerm,
        campaign: k.campaign,
        clicks: k.clicks,
        spend: k.spend,
        sales: k.sales,
        suggestedNegativeMatchType: (k.matchType || '').toLowerCase().includes('broad') ? 'Phrase or Exact' : 'Exact',
      })),
    };
    if (bleeding.length > 0) modules.push({ id: 'bleeding', title: 'Wasted ad spend keywords', description: 'Keywords spending without sales. Fix or add as negatives.', count: bleeding.length, impact: `${sym}${bleeding.reduce((s, k) => s + k.spend, 0).toFixed(0)} wasted`, severity: 'critical', tableRef: 'bleeding', deepDiveTable: bleedingDeepDive });
    if (hidden.length > 0) modules.push({ id: 'hidden', title: 'Keywords ready to scale', description: 'High ROAS, low spend — safe places to increase budget.', count: hidden.length, severity: 'opportunity', tableRef: 'hidden', deepDiveTable: hiddenDeepDive });
    if (negCandidates.length > 0) modules.push({ id: 'negatives', title: 'Search terms to block', description: 'Queries driving spend with no sales. Add as negatives.', count: negCandidates.length, severity: 'warning', tableRef: 'negatives', deepDiveTable: negativesDeepDive });
    if (diagnostics?.searchTermClustering && diagnostics.searchTermClustering.clusters.length > 0) {
      const topClusters = diagnostics.searchTermClustering.clusters.slice(0, 20);
      const clusterDeepDive: DeepDiveTableConfig = {
        columns: [
          { key: 'root', label: 'Cluster (root phrase)' },
          { key: 'membersCount', label: 'Terms', align: 'right' },
          { key: 'spend', label: 'Cluster Spend', align: 'right', format: 'currency' },
          { key: 'revenue', label: 'Cluster Revenue', align: 'right', format: 'currency' },
          { key: 'roas', label: 'Cluster ROAS', align: 'right' },
        ],
        rows: topClusters.map((c) => ({ root: c.root, membersCount: c.members.length, spend: c.spend, revenue: c.revenue, roas: c.roas.toFixed(2) })),
      };
      modules.push({ id: 'search-term-clusters', title: 'Search Term Clusters', description: 'Related queries grouped by root phrase.', count: topClusters.length, severity: 'info', tableRef: 'clusters', deepDiveTable: clusterDeepDive });
    }
    if (diagnostics?.searchTermLeakage && diagnostics.searchTermLeakage.harvestSuggestions.length > 0) {
      const harvestDeepDive: DeepDiveTableConfig = {
        columns: [
          { key: 'searchTerm', label: 'Search Term' },
          { key: 'campaign', label: 'Campaign' },
          { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
          { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
          { key: 'suggestion', label: 'Suggestion' },
        ],
        rows: diagnostics.searchTermLeakage.harvestSuggestions.map((k) => ({ searchTerm: k.searchTerm, campaign: k.campaign, spend: k.spend, sales: k.sales, suggestion: 'Add to manual campaign' })),
      };
      modules.push({ id: 'keyword-harvest', title: 'Keyword Harvest (Auto → Manual)', description: 'Search terms converting in auto but not in manual.', count: diagnostics.searchTermLeakage.harvestSuggestions.length, severity: 'opportunity', tableRef: 'harvest', deepDiveTable: harvestDeepDive });
    }
    if (diagnostics?.keywordLifecycle && diagnostics.keywordLifecycle.lifecycle.size > 0) {
      const lifecycleRows = kws.map((k) => {
        const key = k.searchTerm + '|' + k.campaign;
        const stage = diagnostics!.keywordLifecycle!.lifecycle.get(key) ?? 'Monitor';
        return { keyword: k.searchTerm, campaign: k.campaign, stage, spend: k.spend, sales: k.sales, roas: k.roas.toFixed(2) };
      }).sort((a, b) => b.spend - a.spend).slice(0, 100);
      const lifecycleDeepDive: DeepDiveTableConfig = {
        columns: [
          { key: 'keyword', label: 'Keyword' },
          { key: 'campaign', label: 'Campaign' },
          { key: 'stage', label: 'Lifecycle Stage' },
          { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
          { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
          { key: 'roas', label: 'ROAS', align: 'right' },
        ],
        rows: lifecycleRows,
      };
      modules.push({ id: 'keyword-lifecycle', title: 'Keyword Lifecycle', description: 'Discovery, Scaling, Defensive, Bleeding, Dead.', count: lifecycleRows.length, severity: 'info', tableRef: 'lifecycle', deepDiveTable: lifecycleDeepDive });
    }
  }

  if (tabId === 'campaigns-budget') {
    const highAcos = campaigns.filter((c) => c.acos > 40 && c.sales > 0).sort((a, b) => b.acos - a.acos);
    const bestRoas = campaigns.filter((c) => c.spend > 0 && c.sales / c.spend >= 3).sort((a, b) => (b.sales / b.spend) - (a.sales / a.spend));
    const highAcosDeepDive: DeepDiveTableConfig = {
      columns: [
        { key: 'campaignName', label: 'Campaign' },
        { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
        { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
        { key: 'acos', label: 'ACOS', align: 'right', format: 'percent' },
      ],
      rows: highAcos.map((c) => ({ campaignName: c.campaignName, spend: c.spend, sales: c.sales, acos: c.acos })),
    };
    const scaleDeepDive: DeepDiveTableConfig = {
      columns: [
        { key: 'campaignName', label: 'Campaign' },
        { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
        { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
        { key: 'roas', label: 'ROAS', align: 'right' },
      ],
      rows: bestRoas.map((c) => ({ campaignName: c.campaignName, spend: c.spend, sales: c.sales, roas: (c.sales / c.spend).toFixed(2) })),
    };
    if (highAcos.length > 0) modules.push({ id: 'high-acos', title: 'High ACOS campaigns', description: 'Campaigns above target ACOS. Reduce bids or tighten targeting.', count: highAcos.length, severity: 'warning', tableRef: 'high-acos', deepDiveTable: highAcosDeepDive });
    if (bestRoas.length > 0) modules.push({ id: 'scale-campaigns', title: 'Campaigns ready to scale', description: 'High ROAS campaigns with room to increase budget.', count: bestRoas.length, severity: 'opportunity', tableRef: 'scale-campaigns', deepDiveTable: scaleDeepDive });
    if (diagnostics?.campaignStructure && diagnostics.campaignStructure.duplicateTargeting.length > 0) {
      const dupDeepDive: DeepDiveTableConfig = {
        columns: [
          { key: 'keyword', label: 'Keyword' },
          { key: 'campaigns', label: 'Campaigns' },
        ],
        rows: diagnostics.campaignStructure.duplicateTargeting.slice(0, 50).map((d) => ({ keyword: d.keyword, campaigns: d.campaigns.map((c) => c.campaign).join(', ') })),
      };
      modules.push({ id: 'duplicate-targeting', title: 'Duplicate Targeting', description: 'Same keyword in multiple campaigns.', count: diagnostics.campaignStructure.duplicateTargeting.length, severity: 'warning', tableRef: 'duplicate-targeting', deepDiveTable: dupDeepDive });
    }
    if (diagnostics?.budgetThrottling && diagnostics.budgetThrottling.budgetCappedOpportunities.length > 0) {
      const capDeepDive: DeepDiveTableConfig = {
        columns: [
          { key: 'campaignName', label: 'Campaign' },
          { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
          { key: 'budget', label: 'Budget', align: 'right', format: 'currency' },
          { key: 'roas', label: 'ROAS', align: 'right' },
        ],
        rows: diagnostics.budgetThrottling.budgetCappedOpportunities.map((c) => ({ campaignName: c.campaignName, spend: c.spend, budget: c.budget, roas: c.spend > 0 ? (c.sales / c.spend).toFixed(2) : '—' })),
      };
      modules.push({ id: 'budget-capped', title: 'Budget Capped Opportunities', description: 'Campaigns at budget limit with strong ROAS.', count: diagnostics.budgetThrottling.budgetCappedOpportunities.length, severity: 'opportunity', tableRef: 'budget-capped', deepDiveTable: capDeepDive });
    }
  }

  if (tabId === 'asins-products') {
    const asins = Object.values(store.asinMetrics);
    const topByRoas = asins.filter((a) => a.adSpend > 0).sort((a, b) => (b.adSales / b.adSpend) - (a.adSales / a.adSpend));
    const topAsinsDeepDive: DeepDiveTableConfig = {
      columns: [
        { key: 'asin', label: 'ASIN' },
        { key: 'adSales', label: 'Ad Sales', align: 'right', format: 'currency' },
        { key: 'adSpend', label: 'Ad Spend', align: 'right', format: 'currency' },
        { key: 'roas', label: 'ROAS', align: 'right' },
      ],
      rows: topByRoas.map((a) => ({ asin: a.asin, adSales: a.adSales, adSpend: a.adSpend, roas: (a.adSales / a.adSpend).toFixed(2) })),
    };
    if (topByRoas.length > 0) modules.push({ id: 'top-asins', title: 'Top ASINs by ROAS', description: 'Best-performing products. Consider increasing ad support.', count: topByRoas.length, severity: 'opportunity', tableRef: 'top-asins', deepDiveTable: topAsinsDeepDive });
  }

  if (tabId === 'waste-bleed') {
    const bleeding = diagnostics?.waste ? diagnostics.waste.bleedingKeywords : kws.filter((k) => k.clicks >= 10 && k.sales === 0);
    const totalBleed = diagnostics?.waste ? diagnostics.waste.totalWasteSpend : bleeding.reduce((s, k) => s + k.spend, 0);
    const wastePct = diagnostics?.waste ? diagnostics.waste.wastePctOfTotalAdSpend : (store.totalAdSpend > 0 ? (totalBleed / store.totalAdSpend) * 100 : 0);
    const bleederDeepDive: DeepDiveTableConfig = {
      columns: [
        { key: 'keyword', label: 'Keyword' },
        { key: 'campaign', label: 'Campaign' },
        { key: 'clicks', label: 'Clicks', align: 'right' },
        { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
        { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
        { key: 'acos', label: 'ACOS', align: 'right' },
        { key: 'roas', label: 'ROAS', align: 'right' },
        { key: 'suggestedAction', label: 'Suggested Action' },
      ],
      rows: [...bleeding].sort((a, b) => b.spend - a.spend).map((k) => ({
        keyword: k.searchTerm,
        campaign: k.campaign,
        clicks: k.clicks,
        spend: k.spend,
        sales: k.sales,
        acos: '—',
        roas: '0',
        suggestedAction: 'Deactivate or Add as negative',
      })),
    };
    const desc = wastePct > 0 ? `Waste: ${wastePct.toFixed(1)}% of ad spend. ` : '';
    modules.push({ id: 'bleeder', title: 'Wasted ad spend', description: desc + 'Where your ad budget is being wasted.', count: bleeding.length, impact: totalBleed > 0 ? `${sym}${totalBleed.toFixed(2)}` : undefined, severity: 'critical', tableRef: 'bleeder', deepDiveTable: bleederDeepDive });
    if (diagnostics?.waste && diagnostics.waste.bleedingCampaigns.length > 0) {
      const campDeepDive: DeepDiveTableConfig = {
        columns: [
          { key: 'campaignName', label: 'Campaign' },
          { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
          { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
          { key: 'suggestedAction', label: 'Suggested Action' },
        ],
        rows: diagnostics.waste.bleedingCampaigns.map((c) => ({ campaignName: c.campaignName, spend: c.spend, sales: 0, suggestedAction: 'Review targeting or pause' })),
      };
      modules.push({ id: 'bleeding-campaigns', title: 'Bleeding Campaigns', description: 'Campaigns with spend and no sales.', count: diagnostics.waste.bleedingCampaigns.length, severity: 'critical', tableRef: 'bleeding-campaigns', deepDiveTable: campDeepDive });
    }
  }

  if (tabId === 'profitability-inventory') {
    const m = store.storeMetrics;
    if (m.contributionMargin !== 0) modules.push({ id: 'profit', title: 'Contribution Margin', description: 'Ad sales minus ad spend and product cost.', count: 1, impact: formatCurrency(m.contributionMargin, store.currency), severity: m.contributionMargin >= 0 ? 'info' : 'critical' });
    modules.push({ id: 'health', title: 'Account Health', description: 'TACOS, ROAS, and profitability summary.', count: 1, severity: 'info', tableRef: 'health' });
  }

  if (tabId === 'insights-reports' && diagnostics) {
    if (diagnostics.lostRevenue.lostRevenueEstimate > 0) {
      modules.push({
        id: 'lost-revenue',
        title: 'Lost Revenue Estimate',
        description: 'Revenue lost from ACOS above target.',
        count: 1,
        impact: `${sym}${diagnostics.lostRevenue.lostRevenueEstimate.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        severity: 'warning',
        tableRef: 'lost-revenue',
      });
    }
    if (diagnostics.opportunity.scalingKeywords.length > 0 || diagnostics.opportunity.scalingCampaigns.length > 0) {
      const oppDeepDive: DeepDiveTableConfig = {
        columns: [
          { key: 'type', label: 'Type' },
          { key: 'name', label: 'Name' },
          { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
          { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
          { key: 'roas', label: 'ROAS', align: 'right' },
        ],
        rows: [
          ...diagnostics.opportunity.scalingKeywords.slice(0, 30).map((k) => ({ type: 'Keyword', name: k.searchTerm, spend: k.spend, sales: k.sales, roas: (k.sales / k.spend).toFixed(2) })),
          ...diagnostics.opportunity.scalingCampaigns.slice(0, 20).map((c) => ({ type: 'Campaign', name: c.campaignName, spend: c.spend, sales: c.sales, roas: (c.sales / c.spend).toFixed(2) })),
        ],
      };
      const count = diagnostics.opportunity.scalingKeywords.length + diagnostics.opportunity.scalingCampaigns.length;
      modules.push({ id: 'scaling-opportunities', title: 'Scaling Opportunities', description: 'ROAS above average, spend below average — ready to scale.', count, severity: 'opportunity', tableRef: 'scaling-opportunities', deepDiveTable: oppDeepDive });
    }
    if (diagnostics.portfolioConcentration.topKeywordsByRevenue.length > 0 || diagnostics.portfolioConcentration.topCampaignsBySpend.length > 0) {
      const paretoDeepDive: DeepDiveTableConfig = {
        columns: [
          { key: 'metric', label: 'Metric' },
          { key: 'share', label: 'Share', align: 'right', format: 'percent' },
        ],
        rows: [
          { metric: 'Top 10 keywords revenue share', share: diagnostics.portfolioConcentration.top10KeywordsRevenueShare * 100 },
          { metric: 'Top 5 campaigns spend share', share: diagnostics.portfolioConcentration.top5CampaignsSpendShare * 100 },
        ],
      };
      modules.push({ id: 'portfolio-concentration', title: 'Portfolio Concentration', description: 'Revenue and spend concentration (Pareto).', count: 2, severity: 'info', tableRef: 'portfolio-concentration', deepDiveTable: paretoDeepDive });
    }
  }

  return modules;
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
    const diagnostics = hasData ? runDiagnosticEngines(store) : null;
    const insightModules = buildInsightModules(store, tabId, diagnostics);

    const emptyTables: TabTableConfig[] = [];
    let tables: TabTableConfig[] = emptyTables;

    if (tabId === 'overview') {
      tables = [
        { title: 'Top 20 campaigns by spend', columns: [{ key: 'name', label: 'Campaign' }, { key: 'spend', label: 'Spend', align: 'right', format: 'currency' }], rows: Object.values(store.campaignMetrics).sort((a, b) => b.spend - a.spend).slice(0, 20).map((c) => ({ name: c.campaignName, spend: c.spend })) },
      ];
    }
    if (tabId === 'keywords-search-terms') {
      const allKws = Object.values(store.keywordMetrics);
      const withStatus = allKws.slice(0, 50).map((k) => {
        let status: string = 'Monitor';
        if (k.clicks >= 10 && k.sales === 0) status = 'Negative';
        else if (k.roas >= 4 && k.sales > 0) status = 'Scale';
        else if (k.acos > 30 && k.sales > 0) status = 'Optimize';
        const category = diagnostics?.keywordClassification?.classification.get(k.searchTerm + '|' + k.campaign) ?? '—';
        return { searchTerm: k.searchTerm.slice(0, 35), spend: k.spend, sales: k.sales, acos: k.acos, roas: k.roas.toFixed(2), clicks: k.clicks, status, category };
      });
      const searchTermColumns = [
        { key: 'searchTerm', label: 'Search Term' },
        { key: 'spend', label: 'Spend', align: 'right' as const, format: 'currency' as const },
        { key: 'sales', label: 'Sales', align: 'right' as const, format: 'currency' as const },
        { key: 'acos', label: 'ACOS', align: 'right' as const, format: 'percent' as const },
        { key: 'roas', label: 'ROAS', align: 'right' as const },
        { key: 'status', label: 'Status' },
      ];
      if (diagnostics?.keywordClassification) searchTermColumns.push({ key: 'category', label: 'Category' });
      tables = [
        { title: 'Search Term Performance', columns: searchTermColumns, rows: withStatus, actionColumn: { key: 'searchTerm', label: 'Actions', type: 'optimize' } },
        ...keywordTables(store),
      ];
    }
    if (tabId === 'campaigns-budget') {
      tables = [
        ...campaignTables(store, currency),
        { title: 'Campaign budget utilization', columns: [{ key: 'campaignName', label: 'Campaign' }, { key: 'budget', label: 'Budget', align: 'right', format: 'currency' }, { key: 'spend', label: 'Spend', align: 'right', format: 'currency' }], rows: Object.values(store.campaignMetrics).filter((c) => c.campaignName).slice(0, 20).map((c) => ({ campaignName: c.campaignName, budget: c.budget, spend: c.spend })) },
      ];
    }
    if (tabId === 'asins-products') {
      tables = [
        { title: 'ASIN performance', columns: [{ key: 'asin', label: 'ASIN' }, { key: 'adSales', label: 'Ad Sales', align: 'right', format: 'currency' }, { key: 'adSpend', label: 'Ad Spend', align: 'right', format: 'currency' }, { key: 'acos', label: 'ACOS', align: 'right', format: 'percent' }, { key: 'roas', label: 'ROAS', align: 'right' }], rows: Object.values(store.asinMetrics).slice(0, 30).map((a) => ({ asin: a.asin, adSales: a.adSales, adSpend: a.adSpend, acos: a.acos, roas: a.adSpend > 0 ? (a.adSales / a.adSpend).toFixed(2) : '—' })), actionColumn: { key: 'asin', label: 'Actions', type: 'view' } },
      ];
    }
    if (tabId === 'waste-bleed') {
      const bleedRows = Object.values(store.keywordMetrics).filter((k) => k.clicks >= 10 && k.sales === 0).sort((a, b) => b.spend - a.spend).slice(0, 20).map((k) => ({ searchTerm: k.searchTerm, spend: k.spend, clicks: k.clicks, acos: '—', roas: '0', matchType: k.matchType }));
      tables = [
        { title: 'Top Bleeding Keywords (10+ Clicks, 0 Sales)', columns: [{ key: 'searchTerm', label: 'Keyword' }, { key: 'spend', label: 'Spend', align: 'right', format: 'currency' }, { key: 'clicks', label: 'Clicks', align: 'right' }, { key: 'matchType', label: 'Match Type' }], rows: bleedRows, actionColumn: { key: 'searchTerm', label: 'Action', type: 'deactivate' } },
        ...negativeKeywordTable(store),
      ];
    }
    if (tabId === 'profitability-inventory') {
      tables = [{
        title: 'Account profitability',
        columns: [{ key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value', align: 'right' }],
        rows: [
          { metric: 'TACOS', value: `${store.storeMetrics.tacos.toFixed(1)}%` },
          { metric: 'ROAS', value: store.storeMetrics.roas.toFixed(2) },
          { metric: 'Organic share', value: `${(store.storeMetrics.organicSales && store.totalStoreSales ? (store.storeMetrics.organicSales / store.totalStoreSales) * 100 : 0).toFixed(1)}%` },
          { metric: 'Contribution Margin', value: formatCurrency(store.storeMetrics.contributionMargin, store.currency) },
          { metric: 'Break-even ACOS', value: store.storeMetrics.breakEvenAcos > 0 ? `${store.storeMetrics.breakEvenAcos.toFixed(1)}%` : '—' },
          { metric: 'Profitability Score', value: `${store.storeMetrics.profitabilityScore.toFixed(1)}%` },
          { metric: 'Ad Dependency Ratio', value: `${store.storeMetrics.adDependencyRatio.toFixed(1)}%` },
          { metric: '7d Attributed Sales', value: store.storeMetrics.attributedSales7d > 0 ? formatCurrency(store.storeMetrics.attributedSales7d, store.currency) : '—' },
          { metric: '14d Attributed Sales', value: store.storeMetrics.attributedSales14d > 0 ? formatCurrency(store.storeMetrics.attributedSales14d, store.currency) : '—' },
        ],
      }];
    }

    const chartIds: string[] = [];
    if (tabId === 'overview') chartIds.push('funnel-overview', 'spend-by-campaign', 'roas-by-campaign', 'pareto-spend', 'spend-vs-conversion', 'wasted-spend');
    if (tabId === 'keywords-search-terms') chartIds.push('match-type-spend', 'wasted-spend', 'spend-vs-conversion');
    if (tabId === 'campaigns-budget') chartIds.push('spend-by-campaign', 'roas-by-campaign', 'acos-heatmap', 'budget-pacing');
    if (tabId === 'asins-products') chartIds.push('ad-product-sales', 'organic-vs-ad');
    if (tabId === 'waste-bleed') chartIds.push('wasted-spend');
    if (tabId === 'profitability-inventory') chartIds.push('organic-vs-ad', 'pareto-spend');

    return {
      kpis: hasData ? kpis : [],
      patterns: hasData ? patterns : [],
      opportunities: hasData ? opportunities : [],
      insightModules,
      tables: hasData ? tables : [],
      chartIds,
      currency,
    };
  }, [store, tabId, currency]);
}
