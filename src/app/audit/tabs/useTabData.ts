'use client';

import { useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { formatCurrency, formatPercent } from '../utils/formatNumber';
import type { TabConfig, KPIMetric, PatternDetection, OpportunityDetection, TabTableConfig, InsightModule, DeepDiveTableConfig } from './types';
import type { MemoryStore } from '../utils/reportParser';
import type { DetectedCurrency } from '../utils/currencyDetector';
import { runDiagnosticEngines, type DiagnosticEnginesResult } from '../engines';
import { runSanityChecks, type SanityCheckResults } from '../utils/sanityChecks';
import { getInsightRankingHints } from '@/agents/learningOptimizationAgent';
import { executeMetricEngineForStore } from '@/services/metricExecutionEngine';
import type { OverrideState } from '@/services/overrideEngine';

/** Primary tabs: distributed analysis, deep-dive modules, Gemini Insights, reference UX. */
export type TabId =
  | 'overview'
  | 'keywords-search-terms'
  | 'campaigns-budget'
  | 'asins-products'
  | 'waste-bleed'
  | 'profitability-inventory'
  | 'gemini-insights'
  | 'insights-reports';

function buildKPIs(store: MemoryStore, overrides?: OverrideState): KPIMetric[] {
  const m = store.storeMetrics;
  const canonical = executeMetricEngineForStore(store, overrides);

  const acosPct = canonical.acos * 100;
  const tacosPct = canonical.tacos * 100;
  const totalClicks =
    canonical.totalClicks > 0
      ? canonical.totalClicks
      : store.totalClicks > 0
        ? store.totalClicks
        : Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);
  const totalImpressions =
    canonical.totalImpressions > 0 ? canonical.totalImpressions : store.totalImpressions || 0;
  const totalOrders =
    canonical.totalOrders > 0 ? canonical.totalOrders : store.totalOrders || 0;

  const ctrPct = canonical.ctr > 0
    ? canonical.ctr * 100
    : totalImpressions > 0
      ? (totalClicks / totalImpressions) * 100
      : totalClicks > 0
        ? (totalClicks / Math.max(totalClicks * 50, 1)) * 100
        : 0;

  const cvrPct =
    canonical.cvr > 0
      ? canonical.cvr * 100
      : m.conversionRate > 0
        ? m.conversionRate
        : totalClicks > 0
          ? (totalOrders / totalClicks) * 100
          : 0;

  const cpc = canonical.cpc > 0 ? canonical.cpc : totalClicks > 0 ? store.totalAdSpend / totalClicks : 0;
  const sym = store.currency ? formatCurrency(0, store.currency).replace('0.00', '') : '$';
  return [
    { label: 'Spend', value: `${sym}${store.totalAdSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, status: store.totalAdSpend > 0 ? 'neutral' : undefined },
    { label: 'Sales', value: `${sym}${(store.totalAdSales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, status: 'neutral' },
    { label: 'ACOS', value: formatPercent(acosPct), status: acosPct > 30 ? 'bad' : acosPct < 20 ? 'good' : 'warn' },
    { label: 'ROAS', value: `${m.roas.toFixed(2)}×`, status: m.roas >= 3 ? 'good' : m.roas < 1.5 ? 'bad' : 'warn' },
    { label: 'TACOS', value: formatPercent(tacosPct), status: tacosPct > 25 ? 'bad' : 'good' },
    { label: 'CTR', value: formatPercent(ctrPct), status: 'neutral' },
    { label: 'CVR', value: formatPercent(cvrPct), status: cvrPct >= 8 ? 'good' : cvrPct < 3 ? 'warn' : 'neutral' },
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
  const avgSpend = campaigns.length ? campaigns.reduce((s, c) => s + c.spend, 0) / campaigns.length : 0;
  const highSpendLowRoas = campaigns
    .filter((c) => c.spend >= avgSpend && c.spend > 0 && c.sales > 0 && c.sales / c.spend < 1)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 20);
  const strongRoasLowBudget = campaigns
    .filter((c) => c.budget > 0 && c.spend > 0 && c.sales / c.spend >= 3 && c.spend < c.budget * 0.6)
    .sort((a, b) => (b.sales / b.spend) - (a.sales / a.spend))
    .slice(0, 20);
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
    {
      title: 'High spend, low ROAS campaigns',
      columns: [
        { key: 'campaignName', label: 'Campaign' },
        { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
        { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
        { key: 'roas', label: 'ROAS', align: 'right' },
      ],
      rows: highSpendLowRoas.map((c) => ({
        campaignName: c.campaignName,
        spend: c.spend,
        sales: c.sales,
        roas: c.spend > 0 ? (c.sales / c.spend).toFixed(2) : '—',
      })),
    },
    {
      title: 'Strong ROAS campaigns with modest budgets',
      columns: [
        { key: 'campaignName', label: 'Campaign' },
        { key: 'budget', label: 'Budget', align: 'right', format: 'currency' },
        { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
        { key: 'roas', label: 'ROAS', align: 'right' },
      ],
      rows: strongRoasLowBudget.map((c) => ({
        campaignName: c.campaignName,
        budget: c.budget,
        spend: c.spend,
        roas: c.spend > 0 ? (c.sales / c.spend).toFixed(2) : '—',
      })),
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
  const avgOrderValue =
    store.totalOrders > 0 && store.totalAdSales > 0
      ? store.totalAdSales / store.totalOrders
      : 0;
  const funnel = [...kws]
    .filter((k) => k.clicks > 0 && k.sales > 0)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 50);
  return [
    {
      title: 'Top 50 search terms by revenue',
      columns: [
        { key: 'searchTerm', label: 'Search Term' },
        { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
        { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
      ],
      rows: byRevenue.map((k) => ({
        searchTerm: k.searchTerm,
        sales: k.sales,
        spend: k.spend,
      })),
    },
    {
      title: 'Search terms wasting spend',
      columns: [
        { key: 'searchTerm', label: 'Search Term' },
        { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
        { key: 'clicks', label: 'Clicks', align: 'right' },
      ],
      rows: waste.map((k) => ({
        searchTerm: k.searchTerm,
        spend: k.spend,
        clicks: k.clicks,
      })),
    },
    {
      title: 'High converting search terms',
      columns: [
        { key: 'searchTerm', label: 'Search Term' },
        { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
        { key: 'clicks', label: 'Clicks', align: 'right' },
      ],
      rows: highCvr.map((k) => ({
        searchTerm: k.searchTerm,
        sales: k.sales,
        clicks: k.clicks,
      })),
    },
    {
      title: 'Search term funnel breakdown',
      columns: [
        { key: 'searchTerm', label: 'Search Term' },
        { key: 'clicks', label: 'Clicks', align: 'right' },
        { key: 'orders', label: 'Orders (est.)', align: 'right' },
        { key: 'sales', label: 'Revenue', align: 'right', format: 'currency' },
      ],
      rows: funnel.map((k) => ({
        searchTerm: k.searchTerm,
        clicks: k.clicks,
        orders: avgOrderValue > 0 ? k.sales / avgOrderValue : 0,
        sales: k.sales,
      })),
    },
  ];
}

function keywordAdvancedTables(
  store: MemoryStore,
  diagnostics?: DiagnosticEnginesResult | null
): TabTableConfig[] {
  const tables: TabTableConfig[] = [];
  const kws = Object.values(store.keywordMetrics);

  // Keyword duplication report: same keyword across multiple campaigns.
  const dupMap = new Map<
    string,
    { campaigns: Set<string>; totalSpend: number }
  >();
  for (const k of kws) {
    const term = k.searchTerm;
    if (!term) continue;
    const campaign = k.campaign || '';
    if (!campaign) continue;
    let entry = dupMap.get(term);
    if (!entry) {
      entry = { campaigns: new Set<string>(), totalSpend: 0 };
      dupMap.set(term, entry);
    }
    entry.campaigns.add(campaign);
    entry.totalSpend += k.spend;
  }
  const dupRows = Array.from(dupMap.entries())
    .filter(([, v]) => v.campaigns.size > 1)
    .sort((a, b) => b[1].totalSpend - a[1].totalSpend)
    .slice(0, 50)
    .map(([term, v]) => ({
      searchTerm: term,
      campaigns: Array.from(v.campaigns).join(', '),
      campaignCount: v.campaigns.size,
      totalSpend: v.totalSpend,
    }));
  if (dupRows.length > 0) {
    tables.push({
      title: 'Keyword duplication report',
      columns: [
        { key: 'searchTerm', label: 'Keyword' },
        { key: 'campaigns', label: 'Campaigns using keyword' },
        { key: 'campaignCount', label: 'Campaign count', align: 'right' },
        { key: 'totalSpend', label: 'Total spend', align: 'right', format: 'currency' },
      ],
      rows: dupRows,
    });
  }

  // Keyword opportunity report: auto search terms converting but not in manual.
  if (diagnostics?.searchTermLeakage && diagnostics.searchTermLeakage.harvestSuggestions.length > 0) {
    const oppRows = diagnostics.searchTermLeakage.harvestSuggestions.slice(0, 50).map((k) => ({
      searchTerm: k.searchTerm,
      campaign: k.campaign,
      clicks: k.clicks,
      spend: k.spend,
      sales: k.sales,
      suggestion: 'Add to manual campaign (Exact/Phrase)',
    }));
    tables.push({
      title: 'Keyword opportunity report (Auto → Manual)',
      columns: [
        { key: 'searchTerm', label: 'Search Term' },
        { key: 'campaign', label: 'Auto campaign' },
        { key: 'clicks', label: 'Clicks', align: 'right' },
        { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
        { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
        { key: 'suggestion', label: 'Suggested action' },
      ],
      rows: oppRows,
    });
  }

  // Match type efficiency: compare Exact vs Phrase vs Broad ROAS.
  type MatchAgg = { sales: number; spend: number };
  const rootMap = new Map<
    string,
    { exact?: MatchAgg; phrase?: MatchAgg; broad?: MatchAgg }
  >();
  for (const k of kws) {
    const mtRaw = (k.matchType || '').toLowerCase();
    if (!mtRaw) continue;
    const root = k.searchTerm;
    if (!root) continue;
    let bucket: 'exact' | 'phrase' | 'broad' | undefined;
    if (mtRaw.includes('exact')) bucket = 'exact';
    else if (mtRaw.includes('phrase')) bucket = 'phrase';
    else if (mtRaw.includes('broad')) bucket = 'broad';
    if (!bucket) continue;
    let entry = rootMap.get(root);
    if (!entry) {
      entry = {};
      rootMap.set(root, entry);
    }
    if (!entry[bucket]) entry[bucket] = { sales: 0, spend: 0 };
    entry[bucket]!.sales += k.sales;
    entry[bucket]!.spend += k.spend;
  }
  const matchRows = Array.from(rootMap.entries())
    .map(([term, agg]) => {
      const roasExact =
        agg.exact && agg.exact.spend > 0 ? agg.exact.sales / agg.exact.spend : 0;
      const roasPhrase =
        agg.phrase && agg.phrase.spend > 0 ? agg.phrase.sales / agg.phrase.spend : 0;
      const roasBroad =
        agg.broad && agg.broad.spend > 0 ? agg.broad.sales / agg.broad.spend : 0;
      const variants = [roasExact, roasPhrase, roasBroad].filter((v) => v > 0);
      if (variants.length < 2) return null; // need at least two match types to compare.
      const bestRoas = Math.max(roasExact, roasPhrase, roasBroad);
      const bestMatchType =
        bestRoas === roasExact
          ? 'Exact'
          : bestRoas === roasPhrase
            ? 'Phrase'
            : 'Broad';
      return {
        searchTerm: term,
        bestMatchType,
        roasExact,
        roasPhrase,
        roasBroad,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r != null)
    .sort(
      (a, b) =>
        b.roasExact + b.roasPhrase + b.roasBroad -
        (a.roasExact + a.roasPhrase + a.roasBroad)
    )
    .slice(0, 50);

  if (matchRows.length > 0) {
    tables.push({
      title: 'Match type efficiency (Exact vs Phrase vs Broad)',
      columns: [
        { key: 'searchTerm', label: 'Search Term' },
        { key: 'bestMatchType', label: 'Best match type' },
        { key: 'roasExact', label: 'Exact ROAS', align: 'right' },
        { key: 'roasPhrase', label: 'Phrase ROAS', align: 'right' },
        { key: 'roasBroad', label: 'Broad ROAS', align: 'right' },
      ],
      rows: matchRows.map((r) => ({
        searchTerm: r.searchTerm,
        bestMatchType: r.bestMatchType,
        roasExact: r.roasExact.toFixed(2),
        roasPhrase: r.roasPhrase.toFixed(2),
        roasBroad: r.roasBroad.toFixed(2),
      })),
    });
  }

  // Search term cluster analysis (table view).
  if (diagnostics?.searchTermClustering && diagnostics.searchTermClustering.clusters.length > 0) {
    const clusters = diagnostics.searchTermClustering.clusters.slice(0, 50);
    tables.push({
      title: 'Search term cluster analysis',
      columns: [
        { key: 'root', label: 'Cluster (root phrase)' },
        { key: 'membersCount', label: 'Terms', align: 'right' },
        { key: 'spend', label: 'Cluster spend', align: 'right', format: 'currency' },
        { key: 'revenue', label: 'Cluster revenue', align: 'right', format: 'currency' },
        { key: 'roas', label: 'Cluster ROAS', align: 'right' },
      ],
      rows: clusters.map((c) => ({
        root: c.root,
        membersCount: c.members.length,
        spend: c.spend,
        revenue: c.revenue,
        roas: c.roas.toFixed(2),
      })),
    });
  }

  return tables;
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

function buildInsightModules(
  store: MemoryStore,
  tabId: TabId,
  diagnostics?: DiagnosticEnginesResult | null,
  sanity?: SanityCheckResults | null
): InsightModule[] {
  const sym = store.currency ? formatCurrency(0, store.currency).replace('0.00', '') : '$';
  const modules: InsightModule[] = [];
  const kws = Object.values(store.keywordMetrics);
  const campaigns = Object.values(store.campaignMetrics).filter((c) => c.campaignName);

  if (tabId === 'overview' && diagnostics) {
    const m = store.storeMetrics;
    const strategyDetails: DeepDiveTableConfig = {
      columns: [
        { key: 'indicator', label: 'Indicator' },
        { key: 'value', label: 'Value' },
        { key: 'note', label: 'Insight / Recommendation' },
      ],
      rows: [
        {
          indicator: 'Account strategy',
          value: diagnostics.accountStrategy,
          note: 'Overall positioning based on ACOS, TACOS and ad sales share.',
        },
        {
          indicator: 'TACOS',
          value: `${m.tacos.toFixed(1)}%`,
          note: 'Lower TACOS indicates more profitable, ad-efficient growth.',
        },
        {
          indicator: 'ROAS',
          value: m.roas.toFixed(2),
          note: m.roas >= 3 ? 'Strong return on ad spend — safe room to scale winners.' : 'Return on ad spend needs improvement before scaling.',
        },
        {
          indicator: 'Ad Sales % of Total',
          value: m.adSalesPercent > 0 ? formatPercent(m.adSalesPercent) : '—',
          note: 'Balance between organic and paid sales; monitor dependency on ads.',
        },
        {
          indicator: 'Top campaign concentration',
          value: diagnostics.portfolioConcentration.top5CampaignsSpendShare.toFixed(2),
          note: 'High concentration means growth is driven by a few key campaigns.',
        },
      ],
    };

    modules.push({
      id: 'account-strategy',
      title: 'Account Strategy',
      description: diagnostics.accountStrategy,
      count: 1,
      severity: 'info',
      tableRef: 'account-strategy',
      deepDiveTable: strategyDetails,
      impactScore: 5,
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
    if (critical > 0)
      modules.push({
        id: 'critical',
        title: 'Critical Issues',
        description: 'High ACOS campaigns and bleeding keywords eating into profit.',
        count: critical,
        impact: wasteTotal > 0 ? `${sym}${wasteTotal.toFixed(0)} at risk` : undefined,
        severity: 'critical',
        tableRef: 'critical',
        deepDiveTable: criticalDeepDive,
        impactScore: 9,
        evidence: wasteTotal > 0 ? { summary: `${critical} items; ${sym}${wasteTotal.toFixed(0)} wasted spend.` } : undefined,
      });

    // Phase 4: additional critical-issue tables using sanity checks.
    if (sanity && sanity.highACOSCampaigns.length > 0) {
      const worst = [...sanity.highACOSCampaigns].sort((a, b) => b.acos - a.acos).slice(0, 25);
      const worstAcosDeepDive: DeepDiveTableConfig = {
        columns: [
          { key: 'campaignName', label: 'Campaign' },
          { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
          { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
          { key: 'acos', label: 'ACOS', align: 'right', format: 'percent' },
        ],
        rows: worst.map((c) => ({
          campaignName: c.campaignName,
          spend: c.spend,
          sales: c.sales,
          acos: c.acos,
        })),
      };
      modules.push({
        id: 'worst-acos-campaigns',
        title: 'Worst ACOS campaigns',
        description: 'Campaigns with ACOS well above target — likely loss-driving.',
        count: worst.length,
        severity: 'critical',
        tableRef: 'worst-acos-campaigns',
        deepDiveTable: worstAcosDeepDive,
      });
    }

    if (sanity && sanity.wastedKeywords.length > 0) {
      const wasted = [...sanity.wastedKeywords].sort((a, b) => b.spend - a.spend).slice(0, 50);
      const wastedDeepDive: DeepDiveTableConfig = {
        columns: [
          { key: 'keyword', label: 'Keyword' },
          { key: 'campaign', label: 'Campaign' },
          { key: 'clicks', label: 'Clicks', align: 'right' },
          { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
          { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
        ],
        rows: wasted.map((k) => ({
          keyword: k.searchTerm,
          campaign: k.campaign,
          clicks: k.clicks,
          spend: k.spend,
          sales: k.sales,
        })),
      };
      modules.push({
        id: 'highest-waste-keywords',
        title: 'Highest wasted spend keywords',
        description: 'Keywords with meaningful clicks and spend but zero sales.',
        count: wasted.length,
        severity: 'critical',
        tableRef: 'highest-waste-keywords',
        deepDiveTable: wastedDeepDive,
      });
    }

    if (sanity && sanity.budgetCappedCampaigns.length > 0) {
      const capped = [...sanity.budgetCappedCampaigns].sort((a, b) => b.spend - a.spend).slice(0, 25);
      const cappedDeepDive: DeepDiveTableConfig = {
        columns: [
          { key: 'campaignName', label: 'Campaign' },
          { key: 'budget', label: 'Budget', align: 'right', format: 'currency' },
          { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
          { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
        ],
        rows: capped.map((c) => ({
          campaignName: c.campaignName,
          budget: c.budget,
          spend: c.spend,
          sales: c.sales,
        })),
      };
      modules.push({
        id: 'budget-capped-critical',
        title: 'Budget capped campaigns',
        description: 'Strong ROAS campaigns consistently hitting their daily budgets.',
        count: capped.length,
        severity: 'warning',
        tableRef: 'budget-capped-critical',
        deepDiveTable: cappedDeepDive,
      });
    }
    if (oppCount > 0)
      modules.push({
        id: 'opportunities',
        title: 'Growth Opportunities',
        description: 'High ROAS keywords and campaigns ready to scale.',
        count: oppCount,
        severity: 'opportunity',
        tableRef: 'opportunities',
        deepDiveTable: opportunitiesDeepDive,
        impactScore: 7,
      });

    // Phase 5: additional opportunity tables.
    if (sanity && sanity.scalingKeywords.length > 0) {
      const scaling = [...sanity.scalingKeywords]
        .sort((a, b) => b.roas - a.roas)
        .slice(0, 50);
      const scalingDeepDive: DeepDiveTableConfig = {
        columns: [
          { key: 'keyword', label: 'Keyword' },
          { key: 'campaign', label: 'Campaign' },
          { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
          { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
          { key: 'roas', label: 'ROAS', align: 'right' },
        ],
        rows: scaling.map((k) => ({
          keyword: k.searchTerm,
          campaign: k.campaign,
          spend: k.spend,
          sales: k.sales,
          roas: k.roas.toFixed(2),
        })),
      };
      modules.push({
        id: 'high-roas-low-spend-keywords',
        title: 'High ROAS / low spend keywords',
        description: 'Keywords that are performing well but under-funded.',
        count: scaling.length,
        severity: 'opportunity',
        tableRef: 'high-roas-low-spend-keywords',
        deepDiveTable: scalingDeepDive,
      });
    }

    if (campaigns.length > 0) {
      const avgRoas =
        store.totalAdSpend > 0 ? store.totalAdSales / store.totalAdSpend : 0;
      const highRoasLowBudget = campaigns
        .filter((c) => c.budget > 0 && c.spend > 0)
        .map((c) => ({
          ...c,
          roas: c.spend > 0 ? c.sales / c.spend : 0,
        }))
        .filter(
          (c) =>
            c.roas >= Math.max(3, avgRoas) &&
            c.spend < c.budget * 0.6 // plenty of unused budget
        )
        .sort((a, b) => b.roas - a.roas)
        .slice(0, 25);

      if (highRoasLowBudget.length > 0) {
        const campDeepDive: DeepDiveTableConfig = {
          columns: [
            { key: 'campaignName', label: 'Campaign' },
            { key: 'budget', label: 'Budget', align: 'right', format: 'currency' },
            { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
            { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
            { key: 'roas', label: 'ROAS', align: 'right' },
          ],
          rows: highRoasLowBudget.map((c) => ({
            campaignName: c.campaignName,
            budget: c.budget,
            spend: c.spend,
            sales: c.sales,
            roas: c.roas.toFixed(2),
          })),
        };
        modules.push({
          id: 'campaigns-high-roas-low-budget',
          title: 'Campaigns with high ROAS but low budget',
          description:
            'Strong campaigns where budget is still modest — consider increasing daily budgets.',
          count: highRoasLowBudget.length,
          severity: 'opportunity',
          tableRef: 'campaigns-high-roas-low-budget',
          deepDiveTable: campDeepDive,
        });
      }
    }

    if (diagnostics?.searchTermLeakage && diagnostics.searchTermLeakage.harvestSuggestions.length > 0) {
      const leakage = diagnostics.searchTermLeakage.harvestSuggestions.slice(0, 50);
      const leakageDeepDive: DeepDiveTableConfig = {
        columns: [
          { key: 'searchTerm', label: 'Search Term' },
          { key: 'campaign', label: 'Auto Campaign' },
          { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
          { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
          { key: 'suggestion', label: 'Suggested Action' },
        ],
        rows: leakage.map((k) => ({
          searchTerm: k.searchTerm,
          campaign: k.campaign,
          spend: k.spend,
          sales: k.sales,
          suggestion: 'Promote to Exact match in manual campaign',
        })),
      };
      modules.push({
        id: 'converting-missing-exact',
        title: 'Converting search terms missing Exact',
        description:
          'Auto-campaign terms with sales but no Exact match keyword in manual campaigns.',
        count: leakage.length,
        severity: 'opportunity',
        tableRef: 'converting-missing-exact',
        deepDiveTable: leakageDeepDive,
      });

      const highCtrLeakage = leakage
        .filter((k) => k.clicks >= 10)
        .slice(0, 50);
      if (highCtrLeakage.length > 0) {
        const highCtrDeepDive: DeepDiveTableConfig = {
          columns: [
            { key: 'searchTerm', label: 'Search Term' },
            { key: 'campaign', label: 'Auto Campaign' },
            { key: 'clicks', label: 'Clicks', align: 'right' },
            { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
            { key: 'sales', label: 'Sales', align: 'right', format: 'currency' },
          ],
          rows: highCtrLeakage.map((k) => ({
            searchTerm: k.searchTerm,
            campaign: k.campaign,
            clicks: k.clicks,
            spend: k.spend,
            sales: k.sales,
          })),
        };
        modules.push({
          id: 'high-ctr-not-manual',
          title: 'High CTR keywords not in manual campaigns',
          description:
            'Strong auto-campaign terms with clicks and sales that are not yet mirrored in manual campaigns.',
          count: highCtrLeakage.length,
          severity: 'opportunity',
          tableRef: 'high-ctr-not-manual',
          deepDiveTable: highCtrDeepDive,
        });
      }
    }

    // Products with high organic sales but low ads.
    const asins = Object.values(store.asinMetrics);
    const highOrganicLowAd = asins
      .filter((a) => a.totalSales > 0)
      .map((a) => ({
        ...a,
        adShare: a.adSales > 0 ? a.adSales / a.totalSales : 0,
      }))
      .filter((a) => a.totalSales > 0 && a.adShare < 0.25)
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 25);

    if (highOrganicLowAd.length > 0) {
      const asinDeepDive: DeepDiveTableConfig = {
        columns: [
          { key: 'asin', label: 'ASIN' },
          { key: 'totalSales', label: 'Total Sales', align: 'right', format: 'currency' },
          { key: 'adSales', label: 'Ad Sales', align: 'right', format: 'currency' },
          { key: 'adShare', label: 'Ad Sales Share', align: 'right', format: 'percent' },
        ],
        rows: highOrganicLowAd.map((a) => ({
          asin: a.asin,
          totalSales: a.totalSales,
          adSales: a.adSales,
          adShare: a.adShare * 100,
        })),
      };
      modules.push({
        id: 'organic-strong-low-ads',
        title: 'Products with strong organic sales but low ad support',
        description:
          'ASINs with meaningful organic revenue where ads are barely used — candidates for additional ad coverage.',
        count: highOrganicLowAd.length,
        severity: 'opportunity',
        tableRef: 'organic-strong-low-ads',
        deepDiveTable: asinDeepDive,
      });
    }
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
        rows: topClusters.map((c) => ({
          root: c.root,
          membersCount: c.members.length,
          spend: c.spend,
          revenue: c.revenue,
          roas: c.roas.toFixed(2),
        })),
      };
      modules.push({
        id: 'search-term-clusters',
        title: 'Search Term Clusters',
        description: 'Related queries grouped by root phrase.',
        count: topClusters.length,
        severity: 'info',
        tableRef: 'clusters',
        deepDiveTable: clusterDeepDive,
      });
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
      modules.push({
        id: 'keyword-harvest',
        title: 'Keyword Harvest (Auto → Manual)',
        description: 'Search terms converting in auto but not in manual.',
        count: diagnostics.searchTermLeakage.harvestSuggestions.length,
        severity: 'opportunity',
        tableRef: 'harvest',
        deepDiveTable: harvestDeepDive,
      });
    }
    if (diagnostics?.keywordLifecycle && diagnostics.keywordLifecycle.lifecycle.size > 0) {
      const lifecycleRows = kws
        .map((k) => {
          const key = k.searchTerm + '|' + k.campaign;
          const stage = diagnostics!.keywordLifecycle!.lifecycle.get(key) ?? 'Monitor';
          return {
            keyword: k.searchTerm,
            campaign: k.campaign,
            stage,
            spend: k.spend,
            sales: k.sales,
            roas: k.roas.toFixed(2),
          };
        })
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 100);
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
      modules.push({
        id: 'keyword-lifecycle',
        title: 'Keyword Lifecycle',
        description: 'Discovery, Scaling, Defensive, Bleeding, Dead.',
        count: lifecycleRows.length,
        severity: 'info',
        tableRef: 'lifecycle',
        deepDiveTable: lifecycleDeepDive,
      });
    }

    // Phase 6: additional advanced analytics modules for funnel and match type efficiency.
    const avgOrderValue =
      store.totalOrders > 0 && store.totalAdSales > 0
        ? store.totalAdSales / store.totalOrders
        : 0;
    const funnelTerms = kws
      .filter((k) => k.clicks > 0 && k.sales > 0)
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 50);
    if (funnelTerms.length > 0 && avgOrderValue > 0) {
      const funnelDeepDive: DeepDiveTableConfig = {
        columns: [
          { key: 'searchTerm', label: 'Search Term' },
          { key: 'clicks', label: 'Clicks', align: 'right' },
          { key: 'orders', label: 'Orders (est.)', align: 'right' },
          { key: 'sales', label: 'Revenue', align: 'right', format: 'currency' },
        ],
        rows: funnelTerms.map((k) => ({
          searchTerm: k.searchTerm,
          clicks: k.clicks,
          orders: k.sales / avgOrderValue,
          sales: k.sales,
        })),
      };
      modules.push({
        id: 'search-funnel',
        title: 'Search term funnel',
        description: 'How clicks flow into estimated orders and revenue by query.',
        count: funnelTerms.length,
        severity: 'info',
        tableRef: 'search-funnel',
        deepDiveTable: funnelDeepDive,
      });
    }

    // Match type efficiency module mirrors the table for a quick at-a-glance view.
    type MatchAgg = { sales: number; spend: number };
    const mtRootMap = new Map<
      string,
      { exact?: MatchAgg; phrase?: MatchAgg; broad?: MatchAgg }
    >();
    for (const k of kws) {
      const mtRaw = (k.matchType || '').toLowerCase();
      if (!mtRaw) continue;
      const root = k.searchTerm;
      if (!root) continue;
      let bucket: 'exact' | 'phrase' | 'broad' | undefined;
      if (mtRaw.includes('exact')) bucket = 'exact';
      else if (mtRaw.includes('phrase')) bucket = 'phrase';
      else if (mtRaw.includes('broad')) bucket = 'broad';
      if (!bucket) continue;
      let entry = mtRootMap.get(root);
      if (!entry) {
        entry = {};
        mtRootMap.set(root, entry);
      }
      if (!entry[bucket]) entry[bucket] = { sales: 0, spend: 0 };
      entry[bucket]!.sales += k.sales;
      entry[bucket]!.spend += k.spend;
    }
    const mtSummary = Array.from(mtRootMap.entries())
      .map(([term, agg]) => {
        const roasExact =
          agg.exact && agg.exact.spend > 0 ? agg.exact.sales / agg.exact.spend : 0;
        const roasPhrase =
          agg.phrase && agg.phrase.spend > 0 ? agg.phrase.sales / agg.phrase.spend : 0;
        const roasBroad =
          agg.broad && agg.broad.spend > 0 ? agg.broad.sales / agg.broad.spend : 0;
        const variants = [roasExact, roasPhrase, roasBroad].filter((v) => v > 0);
        if (variants.length < 2) return null;
        const bestRoas = Math.max(roasExact, roasPhrase, roasBroad);
        const bestMatchType =
          bestRoas === roasExact
            ? 'Exact'
            : bestRoas === roasPhrase
              ? 'Phrase'
              : 'Broad';
        return { searchTerm: term, bestMatchType, bestRoas };
      })
      .filter((r): r is NonNullable<typeof r> => r != null)
      .sort((a, b) => b.bestRoas - a.bestRoas)
      .slice(0, 50);

    if (mtSummary.length > 0) {
      const mtDeepDive: DeepDiveTableConfig = {
        columns: [
          { key: 'searchTerm', label: 'Search Term' },
          { key: 'bestMatchType', label: 'Best match type' },
          { key: 'bestRoas', label: 'Best ROAS', align: 'right' },
        ],
        rows: mtSummary.map((r) => ({
          searchTerm: r.searchTerm,
          bestMatchType: r.bestMatchType,
          bestRoas: r.bestRoas.toFixed(2),
        })),
      };
      modules.push({
        id: 'match-type-efficiency',
        title: 'Match type efficiency',
        description:
          'Which match type wins for each search term (Exact vs Phrase vs Broad).',
        count: mtSummary.length,
        severity: 'info',
        tableRef: 'match-type-efficiency',
        deepDiveTable: mtDeepDive,
      });
    }
  }

  if (tabId === 'campaigns-budget') {
    const highAcos = campaigns
      .filter((c) => c.acos > 40 && c.sales > 0)
      .sort((a, b) => b.acos - a.acos);
    const bestRoas = campaigns
      .filter((c) => c.spend > 0 && c.sales / c.spend >= 3)
      .sort((a, b) => (b.sales / b.spend) - (a.sales / a.spend));
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
    if (highAcos.length > 0)
      modules.push({
        id: 'high-acos',
        title: 'High ACOS campaigns',
        description:
          'High spend campaigns with weak efficiency – primary budget drains to fix.',
        count: highAcos.length,
        severity: 'warning',
        tableRef: 'high-acos',
        deepDiveTable: highAcosDeepDive,
      });
    if (bestRoas.length > 0)
      modules.push({
        id: 'scale-campaigns',
        title: 'Campaigns ready to scale',
        description:
          'Strong ROAS campaigns with room to increase budget and impression share.',
        count: bestRoas.length,
        severity: 'opportunity',
        tableRef: 'scale-campaigns',
        deepDiveTable: scaleDeepDive,
      });
    if (diagnostics?.campaignStructure && diagnostics.campaignStructure.duplicateTargeting.length > 0) {
      const dupDeepDive: DeepDiveTableConfig = {
        columns: [
          { key: 'keyword', label: 'Keyword' },
          { key: 'campaigns', label: 'Campaigns using keyword' },
          { key: 'campaignCount', label: 'Campaign count', align: 'right' },
          { key: 'totalSpend', label: 'Total spend', align: 'right', format: 'currency' },
          { key: 'suggestion', label: 'Suggested action' },
        ],
        rows: diagnostics.campaignStructure.duplicateTargeting
          .slice(0, 50)
          .map((d) => {
            const keywordLower = d.keyword.toLowerCase();
            const involvedCampaigns = d.campaigns.map((c) => c.campaign);
            const totalSpend = kws
              .filter(
                (k) =>
                  k.searchTerm.toLowerCase().trim() === keywordLower &&
                  involvedCampaigns.includes(k.campaign)
              )
              .reduce((s, k) => s + k.spend, 0);
            const campaignsText =
              involvedCampaigns.length > 5
                ? `${involvedCampaigns.slice(0, 5).join(', ')}, +${
                    involvedCampaigns.length - 5
                  } more`
                : involvedCampaigns.join(', ');
            return {
              keyword: d.keyword,
              campaigns: campaignsText,
              campaignCount: involvedCampaigns.length,
              totalSpend,
              suggestion: 'Consolidate into fewer focused campaigns to reduce cannibalization.',
            };
          }),
      };
      modules.push({
        id: 'duplicate-targeting',
        title: 'Duplicate targeting & cannibalization',
        description:
          'Keywords split across many campaigns, diluting data and causing internal competition.',
        count: diagnostics.campaignStructure.duplicateTargeting.length,
        severity: 'warning',
        tableRef: 'duplicate-targeting',
        deepDiveTable: dupDeepDive,
      });
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
      modules.push({
        id: 'budget-capped',
        title: 'Budget throttling (capped campaigns)',
        description:
          'Campaigns frequently hitting daily budget – likely losing impression share despite strong ROAS.',
        count: diagnostics.budgetThrottling.budgetCappedOpportunities.length,
        severity: 'opportunity',
        tableRef: 'budget-capped',
        deepDiveTable: capDeepDive,
      });
    }

    // Phase 7: Bid diagnostics (CPC efficiency).
    const kwWithClicks = kws.filter((k) => k.clicks > 0 && k.spend > 0);
    if (kwWithClicks.length > 0) {
      const cpcs = kwWithClicks.map((k) => k.spend / k.clicks).sort((a, b) => a - b);
      const medianCpc = cpcs[Math.floor(cpcs.length / 2)] || 0;
      const highCpc = kwWithClicks
        .filter((k) => k.spend / k.clicks > medianCpc * 1.8 && k.sales <= k.spend)
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 40);
      const lowCpcLowVolume = kwWithClicks
        .filter((k) => k.spend / k.clicks < medianCpc * 0.5 && k.clicks < 5)
        .sort((a, b) => a.clicks - b.clicks)
        .slice(0, 40);
      const bidDiagRows = [
        ...highCpc.map((k) => ({
          keyword: k.searchTerm,
          campaign: k.campaign,
          cpc: k.spend / k.clicks,
          clicks: k.clicks,
          spend: k.spend,
          roas: k.roas.toFixed(2),
          diagnosis: 'CPC well above portfolio median; likely above profitable level.',
        })),
        ...lowCpcLowVolume.map((k) => ({
          keyword: k.searchTerm,
          campaign: k.campaign,
          cpc: k.spend / Math.max(k.clicks, 1),
          clicks: k.clicks,
          spend: k.spend,
          roas: k.roas.toFixed(2),
          diagnosis:
            'Very low CPC and almost no clicks; consider increasing bid to win impressions.',
        })),
      ];
      if (bidDiagRows.length > 0) {
        const bidDeepDive: DeepDiveTableConfig = {
          columns: [
            { key: 'keyword', label: 'Keyword' },
            { key: 'campaign', label: 'Campaign' },
            { key: 'cpc', label: 'CPC', align: 'right' },
            { key: 'clicks', label: 'Clicks', align: 'right' },
            { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
            { key: 'roas', label: 'ROAS', align: 'right' },
            { key: 'diagnosis', label: 'Bid diagnosis' },
          ],
          rows: bidDiagRows,
        };
        modules.push({
          id: 'bid-diagnostics',
          title: 'Bid diagnostics (CPC efficiency)',
          description:
            'Keywords where CPC is likely too high (unprofitable) or too low to win impressions.',
          count: bidDiagRows.length,
          severity: 'warning',
          tableRef: 'bid-diagnostics',
          deepDiveTable: bidDeepDive,
        });
      }
    }

    // Phase 7: Campaign structure diagnostics beyond duplicate targeting.
    const byCampaignStructure = new Map<
      string,
      { asins: Set<string>; keywordCount: number }
    >();
    kws.forEach((k) => {
      const camp = k.campaign || '';
      if (!camp) return;
      let entry = byCampaignStructure.get(camp);
      if (!entry) {
        entry = { asins: new Set<string>(), keywordCount: 0 };
        byCampaignStructure.set(camp, entry);
      }
      if (k.asin) entry.asins.add(k.asin);
      entry.keywordCount += 1;
    });
    const structureRows: Array<{
      issue: string;
      campaignName: string;
      asinCount: number;
      keywordCount: number;
      suggestion: string;
    }> = [];
    byCampaignStructure.forEach((agg, campaignName) => {
      const asinCount = agg.asins.size;
      const keywordCount = agg.keywordCount;
      const lower = campaignName.toLowerCase();
      if (asinCount >= 4) {
        structureRows.push({
          issue: 'Mixed product campaign',
          campaignName,
          asinCount,
          keywordCount,
          suggestion: 'Split into separate campaigns per product group to improve control.',
        });
      }
      if (lower.includes('auto') && keywordCount > 80) {
        structureRows.push({
          issue: 'Auto campaign with too many targets',
          campaignName,
          asinCount,
          keywordCount,
          suggestion:
            'Harvest winners into manual campaigns and reduce targets to regain control.',
        });
      }
    });
    if (structureRows.length > 0) {
      const structureDeepDive: DeepDiveTableConfig = {
        columns: [
          { key: 'issue', label: 'Issue' },
          { key: 'campaignName', label: 'Campaign' },
          { key: 'asinCount', label: 'ASINs', align: 'right' },
          { key: 'keywordCount', label: 'Targets', align: 'right' },
          { key: 'suggestion', label: 'Suggested fix' },
        ],
        rows: structureRows.slice(0, 80),
      };
      modules.push({
        id: 'campaign-structure-diagnostics',
        title: 'Campaign structure diagnostics',
        description:
          'Mixed product groups and oversized auto campaigns that make optimization hard.',
        count: structureRows.length,
        severity: 'info',
        tableRef: 'campaign-structure-diagnostics',
        deepDiveTable: structureDeepDive,
      });
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
      modules.push({ id: 'portfolio-concentration', title: 'Portfolio Concentration', description: 'Revenue and spend concentration (Pareto).', count: 2, severity: 'info', tableRef: 'portfolio-concentration', deepDiveTable: paretoDeepDive, impactScore: 4 });
    }
  }

  modules.sort((a, b) => (b.impactScore ?? 0) - (a.impactScore ?? 0));
  return modules;
}

export function useTabData(tabId: TabId): TabConfig & { currency: DetectedCurrency } {
  const { state } = useAuditStore();
  const store = state.store;
  const currency = store.currency;

  return useMemo(() => {
    const overrides = state.learnedOverrides?.overrides;
    const kpis = buildKPIs(store, overrides);
    const patterns = buildPatterns(store);
    const opportunities = buildOpportunities(store);
    const hasData = store.totalAdSpend > 0 || store.totalStoreSales > 0;
    const diagnostics = hasData ? runDiagnosticEngines(store) : null;
    const sanity = hasData ? runSanityChecks(store) : null;
    let insightModules = buildInsightModules(store, tabId, diagnostics, sanity);
    if (tabId === 'overview' && insightModules.length > 0) {
      const hints = getInsightRankingHints();
      const hintMap = new Map(hints.map((h) => [h.insightId, h.scoreDelta]));
      insightModules = [...insightModules].sort((a, b) => {
        const ia = a.impactScore ?? 0;
        const ib = b.impactScore ?? 0;
        if (ib !== ia) return ib - ia;
        return (hintMap.get(b.id) ?? 0) - (hintMap.get(a.id) ?? 0);
      });
    }

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
        const category =
          diagnostics?.keywordClassification?.classification.get(
            k.searchTerm + '|' + k.campaign
          ) ?? '—';
        return {
          searchTerm: k.searchTerm.slice(0, 35),
          spend: k.spend,
          sales: k.sales,
          acos: k.acos,
          roas: k.roas.toFixed(2),
          clicks: k.clicks,
          status,
          category,
        };
      });
      const searchTermColumns = [
        { key: 'searchTerm', label: 'Search Term' },
        {
          key: 'spend',
          label: 'Spend',
          align: 'right' as const,
          format: 'currency' as const,
        },
        {
          key: 'sales',
          label: 'Sales',
          align: 'right' as const,
          format: 'currency' as const,
        },
        {
          key: 'acos',
          label: 'ACOS',
          align: 'right' as const,
          format: 'percent' as const,
        },
        { key: 'roas', label: 'ROAS', align: 'right' as const },
        { key: 'status', label: 'Status' },
      ];
      if (diagnostics?.keywordClassification)
        searchTermColumns.push({ key: 'category', label: 'Category' });
      tables = [
        {
          title: 'Search Term Performance',
          columns: searchTermColumns,
          rows: withStatus,
          actionColumn: { key: 'searchTerm', label: 'Actions', type: 'optimize' },
        },
        ...keywordTables(store),
        ...searchTermTables(store),
        ...keywordAdvancedTables(store, diagnostics),
      ];
    }
    if (tabId === 'campaigns-budget') {
      tables = [
        ...campaignTables(store, currency),
        {
          title: 'Campaign budget utilization',
          columns: [
            { key: 'campaignName', label: 'Campaign' },
            { key: 'budget', label: 'Budget', align: 'right', format: 'currency' },
            { key: 'spend', label: 'Spend', align: 'right', format: 'currency' },
          ],
          rows: Object.values(store.campaignMetrics)
            .filter((c) => c.campaignName)
            .slice(0, 20)
            .map((c) => ({ campaignName: c.campaignName, budget: c.budget, spend: c.spend })),
        },
      ];
    }
    if (tabId === 'asins-products') {
      const asinRows = Object.values(store.asinMetrics).slice(0, 30).map((a) => {
        const tacosPct = a.totalSales > 0 ? (a.adSpend / a.totalSales) * 100 : null;
        const tacosStatus = tacosPct != null ? (tacosPct < 20 ? 'good' : tacosPct <= 35 ? 'warn' : 'bad') as 'good' | 'warn' | 'bad' : undefined;
        return {
          asin: a.asin,
          adSales: a.adSales,
          adSpend: a.adSpend,
          acos: a.acos,
          tacos: tacosPct,
          tacosStatus,
          roas: a.adSpend > 0 ? (a.adSales / a.adSpend).toFixed(2) : '—',
        };
      });
      tables = [
        {
          title: 'ASIN performance',
          columns: [
            { key: 'asin', label: 'ASIN' },
            { key: 'adSales', label: 'Ad Sales', align: 'right', format: 'currency' },
            { key: 'adSpend', label: 'Ad Spend', align: 'right', format: 'currency' },
            { key: 'acos', label: 'ACOS', align: 'right', format: 'percent' },
            { key: 'tacos', label: 'TACoS', align: 'right', format: 'percentWithStatus' },
            { key: 'roas', label: 'ROAS', align: 'right' },
          ],
          rows: asinRows,
          actionColumn: { key: 'asin', label: 'Actions', type: 'view' },
        },
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
    if (tabId === 'keywords-search-terms') chartIds.push('match-type-spend', 'targeting-type-spend-sales', 'keyword-intent-spend-sales', 'wasted-spend', 'spend-vs-conversion');
    if (tabId === 'campaigns-budget')
      chartIds.push('spend-by-campaign', 'roas-by-campaign', 'spend-vs-conversion', 'acos-heatmap', 'budget-pacing');
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
  }, [store, tabId, currency, state.learnedOverrides]);
}
