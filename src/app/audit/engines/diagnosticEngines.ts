/**
 * Diagnostic engines: run after parse → normalize → aggregate (Campaign Report = source of truth).
 * Populate modules and dropdowns across tabs.
 */

import type { MemoryStore } from '../utils/reportParser';
import type { KeywordMetrics, CampaignMetrics } from '../utils/aggregation';

const TARGET_ACOS = 25;
const DEFAULT_CONVERSION_FACTOR = 2.5;

/** Engine 1 — Waste Spend Detector */
export function wasteSpendDetector(store: MemoryStore) {
  const kws = Object.values(store.keywordMetrics);
  const campaigns = Object.values(store.campaignMetrics);
  const bleedingKeywords = kws.filter((k) => k.spend > 0 && k.sales === 0);
  const bleedingSearchTerms = bleedingKeywords;
  const bleedingCampaigns = campaigns.filter((c) => c.spend > 0 && c.sales === 0);
  const totalWasteSpend = bleedingKeywords.reduce((s, k) => s + k.spend, 0);
  const wastePct = store.totalAdSpend > 0 ? (totalWasteSpend / store.totalAdSpend) * 100 : 0;
  return {
    totalWasteSpend,
    wastePctOfTotalAdSpend: wastePct,
    bleedingKeywords,
    bleedingSearchTerms,
    bleedingCampaigns,
  };
}

/** Engine 2 — Opportunity Scoring (ROAS > avg AND Spend < avg) */
export function opportunityScoringEngine(store: MemoryStore) {
  const kws = Object.values(store.keywordMetrics).filter((k) => k.spend > 0 && k.sales > 0);
  const campaigns = Object.values(store.campaignMetrics).filter((c) => c.spend > 0 && c.sales > 0);
  const avgRoas = store.totalAdSpend > 0 ? store.totalAdSales / store.totalAdSpend : 0;
  const totalSpend = kws.reduce((s, k) => s + k.spend, 0);
  const avgSpend = kws.length > 0 ? totalSpend / kws.length : 0;
  const campAvgSpend = campaigns.length > 0 ? campaigns.reduce((s, c) => s + c.spend, 0) / campaigns.length : 0;
  const score = (k: KeywordMetrics) => {
    const roas = k.sales / k.spend;
    const cvr = k.clicks > 0 ? (k.sales / (k.clicks * 10)) : 0;
    const lowSpendWeight = avgSpend > 0 ? Math.max(0, 1 - k.spend / avgSpend) : 0;
    return roas * 0.5 + cvr * 0.2 + lowSpendWeight * 30;
  };
  const scalingKeywords = kws.filter((k) => k.sales / k.spend > avgRoas && k.spend < avgSpend).sort((a, b) => score(b) - score(a));
  const scalingCampaigns = campaigns.filter((c) => c.sales / c.spend > avgRoas && c.spend < campAvgSpend).sort((a, b) => (b.sales / b.spend) - (a.sales / a.spend));
  return { avgRoas, avgSpend, scalingKeywords, scalingCampaigns, score };
}

/** Engine 3 — Lost Revenue Estimator (ACOS > target) */
export function lostRevenueEstimator(store: MemoryStore, targetAcos = TARGET_ACOS) {
  const kws = Object.values(store.keywordMetrics).filter((k) => k.sales > 0 && k.spend > 0);
  const campaigns = Object.values(store.campaignMetrics).filter((c) => c.sales > 0 && c.spend > 0);
  const excessSpend = (spend: number, sales: number) => {
    const acos = (spend / sales) * 100;
    if (acos <= targetAcos) return 0;
    const targetSpend = sales * (targetAcos / 100);
    return spend - targetSpend;
  };
  let totalExcess = 0;
  kws.forEach((k) => { totalExcess += excessSpend(k.spend, k.sales); });
  campaigns.forEach((c) => { totalExcess += excessSpend(c.spend, c.sales); });
  const lostRevenueEstimate = totalExcess * DEFAULT_CONVERSION_FACTOR;
  return { totalExcessSpend: totalExcess, lostRevenueEstimate };
}

/** Engine 4 — Keyword Classification (Branded, Generic, Competitor, Long Tail, Product Intent) */
export type KeywordCategory = 'Branded' | 'Generic' | 'Competitor' | 'Long Tail' | 'Product Intent';
export function keywordClassificationEngine(
  store: MemoryStore,
  opts?: { brandTerms?: string[]; competitorTerms?: string[] }
) {
  const brandSet = new Set((opts?.brandTerms ?? []).map((t) => t.toLowerCase()));
  const competitorSet = new Set((opts?.competitorTerms ?? []).map((t) => t.toLowerCase()));
  const result = new Map<string, KeywordCategory>();
  Object.values(store.keywordMetrics).forEach((k) => {
    const term = k.searchTerm.toLowerCase();
    const words = term.split(/\s+/).filter(Boolean);
    if (words.some((w) => brandSet.has(w))) {
      result.set(k.searchTerm + '|' + k.campaign, 'Branded');
      return;
    }
    if (words.some((w) => competitorSet.has(w))) {
      result.set(k.searchTerm + '|' + k.campaign, 'Competitor');
      return;
    }
    if (words.length >= 4) {
      result.set(k.searchTerm + '|' + k.campaign, 'Long Tail');
      return;
    }
    const productIntent = ['buy', 'best', 'cheap', 'review', 'vs', 'compare', 'price', 'deal'];
    if (words.some((w) => productIntent.includes(w))) {
      result.set(k.searchTerm + '|' + k.campaign, 'Product Intent');
      return;
    }
    result.set(k.searchTerm + '|' + k.campaign, 'Generic');
  });
  return { classification: result };
}

/** Engine 5 — Search Term Clustering (group by root phrase) */
export function searchTermClusteringEngine(store: MemoryStore) {
  const kws = Object.values(store.keywordMetrics);
  const byRoot = new Map<string, KeywordMetrics[]>();
  kws.forEach((k) => {
    const words = k.searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const root = words.length >= 2 ? words.slice(0, 2).join(' ') : k.searchTerm.toLowerCase();
    if (!byRoot.has(root)) byRoot.set(root, []);
    byRoot.get(root)!.push(k);
  });
  const clusters = Array.from(byRoot.entries())
    .filter(([, members]) => members.length >= 1)
    .map(([root, members]) => {
      const spend = members.reduce((s, m) => s + m.spend, 0);
      const revenue = members.reduce((s, m) => s + m.sales, 0);
      const roas = spend > 0 ? revenue / spend : 0;
      return { root, members, spend, revenue, roas };
    })
    .sort((a, b) => b.spend - a.spend);
  return { clusters };
}

/** Engine 6 — Campaign Structure Audit (duplicate targeting, match type cannibalization) */
export function campaignStructureAudit(store: MemoryStore) {
  const kws = Object.values(store.keywordMetrics);
  const byKeyword = new Map<string, { campaign: string; matchType: string }[]>();
  kws.forEach((k) => {
    const key = k.searchTerm.toLowerCase().trim();
    if (!byKeyword.has(key)) byKeyword.set(key, []);
    byKeyword.get(key)!.push({ campaign: k.campaign, matchType: k.matchType || '' });
  });
  const duplicateTargeting = Array.from(byKeyword.entries())
    .filter(([, campaigns]) => campaigns.length > 1)
    .map(([keyword, campaigns]) => ({ keyword, campaigns }));
  const matchTypes = new Set(kws.map((k) => (k.matchType || '').toLowerCase()));
  const cannibalization = matchTypes.has('broad') && matchTypes.has('exact') ? 'Broad and Exact may compete' : null;
  return { duplicateTargeting, cannibalization };
}

/** Engine 7 — Keyword Lifecycle (Discovery, Scaling, Defensive, Bleeding, Dead) */
export type LifecycleStage = 'Discovery' | 'Scaling' | 'Defensive' | 'Bleeding' | 'Dead';
export function keywordLifecycleEngine(store: MemoryStore) {
  const kws = Object.values(store.keywordMetrics);
  const totalClicks = store.totalClicks || kws.reduce((s, k) => s + k.clicks, 0);
  const avgRoas = store.totalAdSpend > 0 ? store.totalAdSales / store.totalAdSpend : 0;
  const result = new Map<string, LifecycleStage>();
  kws.forEach((k) => {
    const key = k.searchTerm + '|' + k.campaign;
    if (k.spend > 0 && k.sales === 0) {
      result.set(key, 'Bleeding');
      return;
    }
    const impressions = k.clicks * 50;
    if (impressions < 100 && k.spend < 5) {
      result.set(key, 'Discovery');
      return;
    }
    if (k.sales > 0 && k.spend > 0 && k.sales / k.spend > avgRoas * 1.2) {
      result.set(key, 'Scaling');
      return;
    }
    if (k.sales > 0 && k.spend > 0 && k.acos < 15) result.set(key, 'Defensive');
    else if (impressions < 10 && k.spend === 0) result.set(key, 'Dead');
    else result.set(key, 'Defensive');
  });
  return { lifecycle: result };
}

/** Engine 8 — Budget Throttling (daily_spend ≈ budget AND ROAS > avg) */
export function budgetThrottlingDetector(store: MemoryStore) {
  const campaigns = Object.values(store.campaignMetrics).filter((c) => c.campaignName && c.budget > 0);
  const avgRoas = store.totalAdSpend > 0 ? store.totalAdSales / store.totalAdSpend : 0;
  const budgetCapped = campaigns.filter((c) => {
    const roas = c.spend > 0 ? c.sales / c.spend : 0;
    const utilization = c.budget > 0 ? c.spend / c.budget : 0;
    return utilization >= 0.85 && roas > avgRoas;
  });
  return { budgetCappedOpportunities: budgetCapped };
}

/** Engine 9 — Search Term Leakage (converts in auto, not in manual) */
export function searchTermLeakageDetector(store: MemoryStore) {
  const kws = Object.values(store.keywordMetrics).filter((k) => k.sales > 0);
  const autoTerms = new Set(kws.filter((k) => (k.campaign || '').toLowerCase().includes('auto')).map((k) => k.searchTerm.toLowerCase()));
  const manualTerms = new Set(kws.filter((k) => !(k.campaign || '').toLowerCase().includes('auto')).map((k) => k.searchTerm.toLowerCase()));
  const harvestSuggestions = kws.filter((k) => {
    const term = k.searchTerm.toLowerCase();
    return (k.campaign || '').toLowerCase().includes('auto') && !manualTerms.has(term) && k.sales > 0;
  });
  return { harvestSuggestions: harvestSuggestions.slice(0, 50) };
}

/** Engine 10 — Portfolio Concentration */
export function portfolioConcentrationAnalysis(store: MemoryStore) {
  const kws = Object.values(store.keywordMetrics).filter((k) => k.sales > 0).sort((a, b) => b.sales - a.sales);
  const campaigns = Object.values(store.campaignMetrics).sort((a, b) => b.spend - a.spend);
  const totalSales = kws.reduce((s, k) => s + k.sales, 0) || 1;
  const totalSpend = store.totalAdSpend || 1;
  const top10KwRevenue = kws.slice(0, 10).reduce((s, k) => s + k.sales, 0);
  const top5CampSpend = campaigns.slice(0, 5).reduce((s, c) => s + c.spend, 0);
  return {
    top10KeywordsRevenueShare: top10KwRevenue / totalSales,
    top5CampaignsSpendShare: top5CampSpend / totalSpend,
    topKeywordsByRevenue: kws.slice(0, 10),
    topCampaignsBySpend: campaigns.slice(0, 5),
  };
}

/** Engine 11 — Account Strategy Classifier */
export type AccountStrategy = 'Aggressive Growth' | 'Profit Optimization' | 'Under-investing' | 'Over-spending';
export function accountStrategyClassifier(store: MemoryStore) {
  const m = store.storeMetrics;
  const adSalesPct = m.adSalesPercent;
  const tacos = m.tacos;
  const acos = store.totalAdSales > 0 ? (store.totalAdSpend / store.totalAdSales) * 100 : 0;
  if (tacos > 25 && acos > 35) return 'Over-spending';
  if (adSalesPct < 10 && tacos < 8) return 'Under-investing';
  if (acos < 20 && m.roas > 4) return 'Profit Optimization';
  return 'Aggressive Growth';
}

/** Engine 12 — Keyword Profitability Map (CPC x ROAS quadrants) */
export type ProfitabilityQuadrant = 'Scale' | 'Optimize' | 'Monitor' | 'Pause';
export function keywordProfitabilityMap(store: MemoryStore) {
  const kws = Object.values(store.keywordMetrics).filter((k) => k.clicks > 0 && k.spend > 0);
  const avgCpc = kws.length > 0 ? kws.reduce((s, k) => s + k.spend / k.clicks, 0) / kws.length : 0;
  const avgRoas = store.totalAdSpend > 0 ? store.totalAdSales / store.totalAdSpend : 0;
  const points = kws.map((k) => {
    const cpc = k.spend / k.clicks;
    const roas = k.sales > 0 ? k.sales / k.spend : 0;
    let quadrant: ProfitabilityQuadrant = 'Monitor';
    if (roas > avgRoas && cpc <= avgCpc) quadrant = 'Scale';
    else if (roas > avgRoas && cpc > avgCpc) quadrant = 'Optimize';
    else if (k.sales === 0) quadrant = 'Pause';
    return { keyword: k.searchTerm, campaign: k.campaign, cpc, roas, quadrant };
  });
  return { points, avgCpc, avgRoas };
}

/** Result of runDiagnosticEngines – used by tabs to populate modules and charts. */
export type DiagnosticEnginesResult = ReturnType<typeof runDiagnosticEngines>;

/** Run all diagnostic engines and return combined result */
export function runDiagnosticEngines(store: MemoryStore) {
  return {
    waste: wasteSpendDetector(store),
    opportunity: opportunityScoringEngine(store),
    lostRevenue: lostRevenueEstimator(store),
    keywordClassification: keywordClassificationEngine(store),
    searchTermClustering: searchTermClusteringEngine(store),
    campaignStructure: campaignStructureAudit(store),
    keywordLifecycle: keywordLifecycleEngine(store),
    budgetThrottling: budgetThrottlingDetector(store),
    searchTermLeakage: searchTermLeakageDetector(store),
    portfolioConcentration: portfolioConcentrationAnalysis(store),
    accountStrategy: accountStrategyClassifier(store),
    keywordProfitabilityMap: keywordProfitabilityMap(store),
  };
}
