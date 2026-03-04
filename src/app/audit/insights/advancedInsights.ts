/**
 * Advanced insights derived from Search Term, Targeting, Advertised Product,
 * Campaign, and Business reports (as available in MemoryStore).
 * All computations are client-side from aggregated metrics.
 */

import type { MemoryStore } from '../utils/reportParser';
import type { KeywordMetrics } from '../utils/aggregation';

export interface MatchTypeCannibalizationRow {
  keyword: string;
  exactCpc: number;
  broadCpc: number;
  phraseCpc?: number;
  message: string;
}

export interface NegativeKeywordGapRow {
  searchTerm: string;
  spend: number;
  conversions: number;
  campaign: string;
  matchType: string;
}

export interface PortfolioRiskRow {
  type: 'keyword' | 'campaign' | 'asin';
  name: string;
  sharePct: number;
  value: number;
}

export interface KeywordProfitabilityQuadrant {
  scale: Array<{ searchTerm: string; roas: number; spend: number }>;
  optimize: Array<{ searchTerm: string; acos: number; spend: number }>;
  monitor: Array<{ searchTerm: string; spend: number; sales: number }>;
  pause: Array<{ searchTerm: string; spend: number; clicks: number }>;
}

export interface TacosDecomposition {
  trueTacos: number;
  directTacos: number;
  blendedTacos: number;
  organicSharePct: number;
  adSalesSharePct: number;
}

export interface CampaignComplexityScore {
  campaignCount: number;
  totalKeywords: number;
  keywordsPerCampaign: number;
  duplicateKeywordCount: number;
  matchTypeOverlapCount: number;
  scoreLabel: string;
  scorePct: number;
}

export interface TrafficEfficiencyScore {
  totalClicks: number;
  totalSales: number;
  totalOrders: number;
  clickToSaleRatePct: number;
  scorePct: number;
  label: string;
}

export interface AccountStrategyClassification {
  strategy: 'Brand Defense' | 'Acquisition' | 'Hybrid Growth';
  confidence: number;
  reasoning: string;
}

export interface SearchTermLeakageRow {
  searchTerm: string;
  matchType: string;
  spend: number;
  campaign: string;
  message: string;
}

export interface AdvancedInsightsResult {
  matchTypeCannibalization: MatchTypeCannibalizationRow[];
  negativeKeywordGap: NegativeKeywordGapRow[];
  portfolioRisk: PortfolioRiskRow[];
  keywordProfitability: KeywordProfitabilityQuadrant;
  tacosDecomposition: TacosDecomposition;
  campaignComplexity: CampaignComplexityScore;
  trafficEfficiency: TrafficEfficiencyScore;
  accountStrategy: AccountStrategyClassification;
  searchTermLeakage: SearchTermLeakageRow[];
  keywordSaturationCount: number;
  scaleReadinessPct: number;
}

function normalizeKeyword(term: string): string {
  return term.trim().toLowerCase();
}

/** Same keyword in multiple match types: compare CPC. Broad/Phrase stealing from Exact = cannibalization. */
export function computeMatchTypeCannibalization(store: MemoryStore): MatchTypeCannibalizationRow[] {
  const byBase: Record<string, { exact?: KeywordMetrics; broad?: KeywordMetrics; phrase?: KeywordMetrics }> = {};
  for (const m of Object.values(store.keywordMetrics)) {
    const base = normalizeKeyword(m.searchTerm);
    if (!base) continue;
    if (!byBase[base]) byBase[base] = {};
    const mt = (m.matchType || '').toLowerCase();
    if (mt.includes('exact')) byBase[base].exact = m;
    else if (mt.includes('broad')) byBase[base].broad = m;
    else if (mt.includes('phrase')) byBase[base].phrase = m;
  }
  const out: MatchTypeCannibalizationRow[] = [];
  for (const [keyword, entries] of Object.entries(byBase)) {
    const exact = entries.exact;
    const broad = entries.broad;
    const phrase = entries.phrase;
    const exactCpc = exact && exact.clicks > 0 ? exact.spend / exact.clicks : 0;
    const broadCpc = broad && broad.clicks > 0 ? broad.spend / broad.clicks : 0;
    const phraseCpc = phrase && phrase.clicks > 0 ? phrase.spend / phrase.clicks : 0;
    if (broad && exact && broad.clicks >= 5 && broadCpc > exactCpc * 1.1) {
      out.push({
        keyword,
        exactCpc,
        broadCpc,
        message: 'Broad campaign likely stealing traffic from exact; consider tightening or adding negatives.',
      });
    }
    if (phrase && exact && phrase.clicks >= 5 && phraseCpc > exactCpc * 1.1) {
      out.push({
        keyword,
        exactCpc,
        broadCpc: phraseCpc,
        phraseCpc,
        message: 'Phrase CPC higher than exact; review overlap.',
      });
    }
  }
  return out.slice(0, 20);
}

/** High spend, zero conversions = suggested negative (no negative applied). */
export function computeNegativeKeywordGap(store: MemoryStore): NegativeKeywordGapRow[] {
  return Object.values(store.keywordMetrics)
    .filter((m) => m.clicks >= 5 && m.sales === 0)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 30)
    .map((m) => ({
      searchTerm: m.searchTerm,
      spend: m.spend,
      conversions: 0,
      campaign: m.campaign,
      matchType: m.matchType,
    }));
}

/** Revenue/spend concentration: top 10 keywords, campaigns, ASINs. */
export function computePortfolioRisk(store: MemoryStore): PortfolioRiskRow[] {
  const totalSpend = store.totalAdSpend || 1;
  const totalSales = store.totalAdSales || 1;
  const rows: PortfolioRiskRow[] = [];
  const kwList = Object.values(store.keywordMetrics).sort((a, b) => b.spend - a.spend).slice(0, 10);
  let cum = 0;
  for (const k of kwList) {
    cum += k.spend;
    rows.push({ type: 'keyword', name: k.searchTerm.slice(0, 40), sharePct: (cum / totalSpend) * 100, value: k.spend });
  }
  const campList = Object.values(store.campaignMetrics).sort((a, b) => b.spend - a.spend).slice(0, 10);
  cum = 0;
  for (const c of campList) {
    cum += c.spend;
    rows.push({ type: 'campaign', name: (c.campaignName || '').slice(0, 40), sharePct: (cum / totalSpend) * 100, value: c.spend });
  }
  const asinList = Object.values(store.asinMetrics).sort((a, b) => b.adSales - a.adSales).slice(0, 10);
  cum = 0;
  const totalAdSalesForAsins = asinList.reduce((s, a) => s + a.adSales, 0) || 1;
  for (const a of asinList) {
    cum += a.adSales;
    rows.push({ type: 'asin', name: a.asin, sharePct: (cum / totalAdSalesForAsins) * 100, value: a.adSales });
  }
  return rows;
}

/** Quadrants: scale (high ROAS), optimize (high ACOS), monitor (mid), pause (waste). */
export function computeKeywordProfitability(store: MemoryStore): KeywordProfitabilityQuadrant {
  const scale: KeywordProfitabilityQuadrant['scale'] = [];
  const optimize: KeywordProfitabilityQuadrant['optimize'] = [];
  const monitor: KeywordProfitabilityQuadrant['monitor'] = [];
  const pause: KeywordProfitabilityQuadrant['pause'] = [];
  for (const m of Object.values(store.keywordMetrics)) {
    if (m.clicks >= 10 && m.sales === 0) {
      pause.push({ searchTerm: m.searchTerm, spend: m.spend, clicks: m.clicks });
    } else if (m.sales > 0) {
      if (m.roas >= 4 && m.spend >= 5) scale.push({ searchTerm: m.searchTerm, roas: m.roas, spend: m.spend });
      else if (m.acos > 25 && m.spend >= 10) optimize.push({ searchTerm: m.searchTerm, acos: m.acos, spend: m.spend });
      else monitor.push({ searchTerm: m.searchTerm, spend: m.spend, sales: m.sales });
    }
  }
  return { scale: scale.slice(0, 15), optimize: optimize.slice(0, 15), monitor: monitor.slice(0, 15), pause: pause.slice(0, 15) };
}

/** True TACOS = ad spend / total sales. Direct = ad spend / ad sales. Blended = same as true. */
export function computeTacosDecomposition(store: MemoryStore): TacosDecomposition {
  const totalSales = store.totalStoreSales || 1;
  const adSales = store.totalAdSales || 0;
  const adSpend = store.totalAdSpend || 0;
  const organicSales = store.storeMetrics.organicSales ?? totalSales - adSales;
  return {
    trueTacos: totalSales > 0 ? (adSpend / totalSales) * 100 : 0,
    directTacos: adSales > 0 ? (adSpend / adSales) * 100 : 0,
    blendedTacos: totalSales > 0 ? (adSpend / totalSales) * 100 : 0,
    organicSharePct: totalSales > 0 ? (organicSales / totalSales) * 100 : 0,
    adSalesSharePct: totalSales > 0 ? (adSales / totalSales) * 100 : 0,
  };
}

/** Campaign count, keyword density, duplicate keywords across campaigns. */
export function computeCampaignComplexity(store: MemoryStore): CampaignComplexityScore {
  const campaignCount = Object.keys(store.campaignMetrics).length || 1;
  const keywords = Object.values(store.keywordMetrics);
  const totalKeywords = keywords.length;
  const keywordsPerCampaign = totalKeywords / campaignCount;
  const byBase: Record<string, number> = {};
  for (const m of keywords) {
    const base = normalizeKeyword(m.searchTerm);
    if (base) byBase[base] = (byBase[base] || 0) + 1;
  }
  const duplicateKeywordCount = Object.values(byBase).filter((c) => c > 1).length;
  const matchTypeOverlapCount = Object.keys(byBase).filter((k) => {
    const matchTypes = new Set(keywords.filter((kw) => normalizeKeyword(kw.searchTerm) === k).map((kw) => kw.matchType));
    return matchTypes.size > 1;
  }).length;
  const complexity = Math.min(100, duplicateKeywordCount * 2 + matchTypeOverlapCount + campaignCount);
  const scorePct = Math.max(0, 100 - complexity);
  let scoreLabel = 'High';
  if (scorePct < 40) scoreLabel = 'High complexity';
  else if (scorePct < 70) scoreLabel = 'Moderate';
  else scoreLabel = 'Manageable';
  return {
    campaignCount,
    totalKeywords,
    keywordsPerCampaign: Math.round(keywordsPerCampaign * 10) / 10,
    duplicateKeywordCount,
    matchTypeOverlapCount,
    scoreLabel,
    scorePct,
  };
}

/** Clicks → sales conversion efficiency (no impressions in current model). */
export function computeTrafficEfficiency(store: MemoryStore): TrafficEfficiencyScore {
  const totalClicks = Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);
  const totalSales = store.totalAdSales || 0;
  const totalOrders = store.totalOrders || 0;
  const clickToSaleRatePct = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;
  let scorePct = 50;
  if (totalClicks > 0) {
    if (clickToSaleRatePct >= 10) scorePct = 90;
    else if (clickToSaleRatePct >= 5) scorePct = 75;
    else if (clickToSaleRatePct >= 2) scorePct = 55;
    else scorePct = 35;
  }
  let label = 'Moderate';
  if (scorePct >= 80) label = 'Efficient';
  else if (scorePct >= 60) label = 'Good';
  else if (scorePct < 40) label = 'Needs improvement';
  return { totalClicks, totalSales, totalOrders, clickToSaleRatePct, scorePct, label };
}

/** Heuristic: low ACOS + high organic = brand defense; high ACOS + acquisition = acquisition; mixed = hybrid. */
export function computeAccountStrategy(store: MemoryStore): AccountStrategyClassification {
  const m = store.storeMetrics;
  const organicShare = store.totalStoreSales > 0 ? (m.organicSales ?? 0) / store.totalStoreSales : 0;
  const tacos = m.tacos;
  const roas = m.roas;
  if (organicShare >= 0.6 && tacos < 25) {
    return { strategy: 'Brand Defense', confidence: 75, reasoning: 'High organic share and controlled TACOS suggest brand-led demand.' };
  }
  if (tacos > 30 && roas < 3) {
    return { strategy: 'Acquisition', confidence: 70, reasoning: 'Higher TACOS and lower ROAS indicate acquisition-focused spend.' };
  }
  return { strategy: 'Hybrid Growth', confidence: 65, reasoning: 'Mixed metrics suggest balanced brand and acquisition efforts.' };
}

/** Search terms from broad/auto match types = leakage risk (triggered but not explicitly targeted). */
export function computeSearchTermLeakage(store: MemoryStore): SearchTermLeakageRow[] {
  return Object.values(store.keywordMetrics)
    .filter((m) => {
      const mt = (m.matchType || '').toLowerCase();
      return (mt.includes('broad') || mt.includes('auto')) && m.spend >= 3;
    })
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 25)
    .map((m) => ({
      searchTerm: m.searchTerm,
      matchType: m.matchType,
      spend: m.spend,
      campaign: m.campaign,
      message: `Triggered from ${m.matchType}; consider adding as exact/phrase target or negative.`,
    }));
}

/** Keywords with high spend, low ROAS = potentially saturated (cross-sectional). */
export function computeKeywordSaturationCount(store: MemoryStore): number {
  return Object.values(store.keywordMetrics).filter(
    (m) => m.spend >= 50 && m.sales > 0 && m.roas < 1.5
  ).length;
}

/** Scale readiness: share of keywords in "scale" quadrant + healthy ROAS campaigns. */
export function computeScaleReadiness(store: MemoryStore): number {
  const kws = Object.values(store.keywordMetrics);
  const scaleCandidates = kws.filter((m) => m.sales > 0 && m.roas >= 4 && m.spend >= 5);
  const totalSpend = store.totalAdSpend || 1;
  const scaleSpend = scaleCandidates.reduce((s, m) => s + m.spend, 0);
  const campaigns = Object.values(store.campaignMetrics).filter((c) => c.sales > 0 && c.spend > 0 && c.sales / c.spend >= 3);
  const campaignScore = store.campaignMetrics && Object.keys(store.campaignMetrics).length > 0
    ? (campaigns.length / Object.keys(store.campaignMetrics).length) * 50
    : 0;
  const spendScore = Math.min(50, (scaleSpend / totalSpend) * 100);
  return Math.round(Math.min(100, campaignScore + spendScore));
}

export function computeAdvancedInsights(store: MemoryStore): AdvancedInsightsResult {
  return {
    matchTypeCannibalization: computeMatchTypeCannibalization(store),
    negativeKeywordGap: computeNegativeKeywordGap(store),
    portfolioRisk: computePortfolioRisk(store),
    keywordProfitability: computeKeywordProfitability(store),
    tacosDecomposition: computeTacosDecomposition(store),
    campaignComplexity: computeCampaignComplexity(store),
    trafficEfficiency: computeTrafficEfficiency(store),
    accountStrategy: computeAccountStrategy(store),
    searchTermLeakage: computeSearchTermLeakage(store),
    keywordSaturationCount: computeKeywordSaturationCount(store),
    scaleReadinessPct: computeScaleReadiness(store),
  };
}
