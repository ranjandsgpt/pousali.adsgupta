import type { MemoryStore } from '@/app/audit/utils/reportParser';
import type { SanityCheckResults } from '@/app/audit/utils/sanityChecks';

export interface AccountHealthBreakdown {
  healthScore: number;
  categoryBreakdown: {
    campaignStructure: number;
    keywordQuality: number;
    searchTermMining: number;
    budgetEfficiency: number;
    bidOptimization: number;
  };
}

/**
 * Deterministic Account Health Score Engine.
 *
 * Simple 0–100 score with 5 equally weighted categories (20 points each).
 * Uses existing deterministic metrics + sanity checks; no LLM involvement.
 */
export function computeAccountHealthScore(
  store: MemoryStore,
  sanity: SanityCheckResults
): AccountHealthBreakdown {
  const breakdown = {
    campaignStructure: 20,
    keywordQuality: 20,
    searchTermMining: 20,
    budgetEfficiency: 20,
    bidOptimization: 20,
  };

  const totalAdSpend = store.totalAdSpend || 0;
  const totalAdSales = store.totalAdSales || 0;

  // Campaign Structure – penalize for duplicate targeting and very high ACOS campaigns.
  const duplicatePenalty = Math.min(
    sanity.highACOSCampaigns.length * 2,
    10
  );
  breakdown.campaignStructure -= duplicatePenalty;

  // Keyword Quality – penalize for wasted keywords relative to total keyword count.
  const keywordCount = Object.keys(store.keywordMetrics).length || 1;
  const wastedRatio = sanity.wastedKeywords.length / keywordCount;
  breakdown.keywordQuality -= Math.min(Math.round(wastedRatio * 20), 12);

  // Search Term Mining – reward scaling keywords, penalize if none.
  if (sanity.scalingKeywords.length === 0) {
    breakdown.searchTermMining -= 10;
  } else if (sanity.scalingKeywords.length < 5) {
    breakdown.searchTermMining -= 4;
  }

  // Budget Efficiency – penalize when many campaigns look budget capped.
  const budgetPenalty = Math.min(
    sanity.budgetCappedCampaigns.length * 2,
    12
  );
  breakdown.budgetEfficiency -= budgetPenalty;

  // Bid Optimization – penalize if ACOS is far above a 25% reference.
  const acos =
    totalAdSales > 0 ? (totalAdSpend / totalAdSales) * 100 : 0;
  if (acos > 50) {
    breakdown.bidOptimization -= 10;
  } else if (acos > 35) {
    breakdown.bidOptimization -= 5;
  }

  // Clamp each category between 0 and 20
  (Object.keys(breakdown) as (keyof typeof breakdown)[]).forEach((k) => {
    const current = breakdown[k];
    breakdown[k] = Math.max(0, Math.min(20, current));
  });

  const healthScore =
    breakdown.campaignStructure +
    breakdown.keywordQuality +
    breakdown.searchTermMining +
    breakdown.budgetEfficiency +
    breakdown.bidOptimization;

  return {
    healthScore,
    categoryBreakdown: breakdown,
  };
}

