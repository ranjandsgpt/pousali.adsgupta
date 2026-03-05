/**
 * Weighted Health Score model for Amazon PPC audit.
 * 25% Campaign Efficiency + 20% Keyword Waste + 20% Targeting Quality
 * + 15% Budget Utilization + 10% Conversion Health + 10% Structural Hygiene
 * Bands: 0-39 Critical, 40-59 Poor, 60-74 Needs Improvement, 75-89 Healthy, 90-100 Excellent
 */

import type { MemoryStore } from './reportParser';
import { runDiagnosticEngines } from '../engines';
import { runSanityChecks } from './sanityChecks';

const TARGET_ACOS = 25;
const MAX_SCORE_PER_SUBSYSTEM = 100;

function clampScore(s: number): number {
  return Math.max(0, Math.min(MAX_SCORE_PER_SUBSYSTEM, s));
}

/** 25% — ACOS vs target, ROAS trend, high ACOS campaigns */
function campaignEfficiencyScore(store: MemoryStore): number {
  const campaigns = Object.values(store.campaignMetrics).filter((c) => c.spend > 0);
  if (campaigns.length === 0) return 70;
  const accountAcos = store.totalAdSales > 0 ? (store.totalAdSpend / store.totalAdSales) * 100 : 0;
  const accountRoas = store.totalAdSpend > 0 ? store.totalAdSales / store.totalAdSpend : 0;
  let score = 50;
  if (accountAcos <= TARGET_ACOS) score += 25;
  else if (accountAcos <= 40) score += 10;
  else if (accountAcos > 60) score -= 30;
  else score -= 15;
  if (accountRoas >= 4) score += 15;
  else if (accountRoas >= 2) score += 5;
  else if (accountRoas < 1) score -= 20;
  const highAcosCount = campaigns.filter((c) => c.sales > 0 && c.acos > 50).length;
  const highAcosRatio = campaigns.length > 0 ? highAcosCount / campaigns.length : 0;
  if (highAcosRatio > 0.3) score -= 20;
  else if (highAcosRatio > 0.1) score -= 10;
  return clampScore(score);
}

/** 20% — spend with zero sales, wasted spend ratio, bleeding keywords */
function keywordWasteScore(store: MemoryStore): number {
  const waste = runDiagnosticEngines(store).waste;
  if (store.totalAdSpend <= 0) return 80;
  const wasteRatio = waste.totalWasteSpend / store.totalAdSpend;
  let score = 80;
  if (wasteRatio >= 0.3) score -= 50;
  else if (wasteRatio >= 0.15) score -= 30;
  else if (wasteRatio >= 0.05) score -= 15;
  const bleedingCount = waste.bleedingKeywords.length;
  if (bleedingCount > 50) score -= 20;
  else if (bleedingCount > 20) score -= 10;
  return clampScore(score);
}

/** 20% — duplicate targeting, overlapping keywords, match type coverage */
function targetingQualityScore(store: MemoryStore): number {
  const diagnostics = runDiagnosticEngines(store);
  const dupes = diagnostics.campaignStructure.duplicateTargeting.length;
  const kws = Object.values(store.keywordMetrics);
  const withMatchType = kws.filter((k) => (k.matchType || '').trim().length > 0).length;
  const matchCoverage = kws.length > 0 ? withMatchType / kws.length : 0;
  let score = 70;
  if (dupes > 20) score -= 40;
  else if (dupes > 5) score -= 20;
  if (matchCoverage < 0.5) score -= 15;
  return clampScore(score);
}

/** 15% — budget capped campaigns, underfunded profitable campaigns */
function budgetUtilizationScore(store: MemoryStore): number {
  const sanity = runSanityChecks(store);
  const diagnostics = runDiagnosticEngines(store);
  const capped = sanity.budgetCappedCampaigns.length;
  const campaigns = Object.values(store.campaignMetrics).filter((c) => c.budget > 0);
  let score = 60;
  if (capped > 0 && campaigns.length > 0) {
    const ratio = capped / campaigns.length;
    if (ratio > 0.2) score += 25;
    else if (ratio > 0.1) score += 15;
  }
  if (diagnostics.budgetThrottling.budgetCappedOpportunities.length > 5) score += 15;
  return clampScore(score);
}

/** 10% — CTR, CVR, CPC vs benchmark (simplified: use conversion and clicks) */
function conversionHealthScore(store: MemoryStore): number {
  const m = store.storeMetrics;
  const totalClicks = store.totalClicks || Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);
  const orders = store.totalOrders || 0;
  const sessions = store.totalSessions || Object.values(store.asinMetrics).reduce((s, a) => s + a.sessions, 0);
  const cvr = sessions > 0 && orders > 0 ? (orders / sessions) * 100 : m.conversionRate || 0;
  let score = 50;
  if (cvr >= 10) score += 30;
  else if (cvr >= 5) score += 15;
  else if (cvr < 2 && totalClicks > 100) score -= 25;
  if (totalClicks > 0 && store.totalAdSpend > 0) {
    const cpc = store.totalAdSpend / totalClicks;
    if (cpc > 2) score -= 10;
  }
  return clampScore(score);
}

/** 10% — campaign duplication, ad group fragmentation, ASIN coverage */
function structuralHygieneScore(store: MemoryStore): number {
  const campaigns = Object.values(store.campaignMetrics);
  const asins = Object.keys(store.asinMetrics).length;
  const kws = Object.values(store.keywordMetrics).length;
  let score = 70;
  const campaignNames = new Set(campaigns.map((c) => c.campaignName?.toLowerCase()).filter(Boolean));
  if (campaigns.length > 0 && campaignNames.size < campaigns.length * 0.9) score -= 15;
  if (asins === 0 && store.totalAdSales > 0) score -= 20;
  if (kws > 500 && asins < 10) score -= 10;
  return clampScore(score);
}

export interface HealthScoreResult {
  healthScore: number;
  healthLabel: 'Critical' | 'Poor' | 'Needs Improvement' | 'Healthy' | 'Excellent';
  criticalIssuesCount: number;
  riskScore: number;
  wastedSpendEstimate: number;
  breakdown: {
    campaignEfficiency: number;
    keywordWaste: number;
    targetingQuality: number;
    budgetUtilization: number;
    conversionHealth: number;
    structuralHygiene: number;
  };
}

export function computeHealthScore(store: MemoryStore): HealthScoreResult {
  const waste = runDiagnosticEngines(store).waste;
  const sanity = runSanityChecks(store);
  const campaigns = Object.values(store.campaignMetrics);
  const bleeding = waste.bleedingKeywords.length;
  const highAcosCamp = campaigns.filter((c) => c.sales > 0 && c.acos > 50).length;
  const criticalIssuesCount = bleeding + highAcosCamp + sanity.highACOSCampaigns.length;
  const wastedSpendEstimate = waste.totalWasteSpend;

  const campaignEfficiency = campaignEfficiencyScore(store);
  const keywordWaste = keywordWasteScore(store);
  const targetingQuality = targetingQualityScore(store);
  const budgetUtilization = budgetUtilizationScore(store);
  const conversionHealth = conversionHealthScore(store);
  const structuralHygiene = structuralHygieneScore(store);

  const weighted =
    campaignEfficiency * 0.25 +
    keywordWaste * 0.2 +
    targetingQuality * 0.2 +
    budgetUtilization * 0.15 +
    conversionHealth * 0.1 +
    structuralHygiene * 0.1;
  const healthScore = Math.round(Math.max(0, Math.min(100, weighted)));
  const riskScore = Math.round(100 - weighted);

  let healthLabel: HealthScoreResult['healthLabel'] = 'Critical';
  if (healthScore >= 90) healthLabel = 'Excellent';
  else if (healthScore >= 75) healthLabel = 'Healthy';
  else if (healthScore >= 60) healthLabel = 'Needs Improvement';
  else if (healthScore >= 40) healthLabel = 'Poor';

  return {
    healthScore,
    healthLabel,
    criticalIssuesCount,
    riskScore,
    wastedSpendEstimate,
    breakdown: {
      campaignEfficiency,
      keywordWaste,
      targetingQuality,
      budgetUtilization,
      conversionHealth,
      structuralHygiene,
    },
  };
}
