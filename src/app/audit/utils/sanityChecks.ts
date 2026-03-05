/**
 * Phase 3: Data sanity engine.
 *
 * IMPORTANT: This module is read-only with respect to the existing analytics
 * engine. It consumes the current MemoryStore aggregates and returns
 * categorized lists that other layers (diagnostics, UI) can use.
 */

import type { MemoryStore } from './reportParser';
import type { KeywordMetrics, CampaignMetrics } from './aggregation';

export interface SanityCheckResults {
  /** Keywords with significant clicks/spend and zero sales. */
  wastedKeywords: KeywordMetrics[];
  /** High-ROAS keywords with relatively low spend (scaling candidates). */
  scalingKeywords: KeywordMetrics[];
  /** Campaigns with very high ACOS (loss-driving). */
  highACOSCampaigns: CampaignMetrics[];
  /** Campaigns likely budget capped but performing well. */
  budgetCappedCampaigns: CampaignMetrics[];
}

interface SanityCheckOptions {
  wastedClicksMin?: number;
  wastedSpendMin?: number;
  highAcosThreshold?: number;
  scalingRoasMin?: number;
}

/**
 * Run lightweight sanity checks on top of MemoryStore.
 *
 * This does NOT mutate the store. It only classifies existing metrics
 * into buckets that can power Critical Issues / Opportunities UIs.
 */
export function runSanityChecks(
  store: MemoryStore,
  options: SanityCheckOptions = {}
): SanityCheckResults {
  const {
    wastedClicksMin = 10,
    wastedSpendMin = 0,
    highAcosThreshold = 100,
    scalingRoasMin = 3,
  } = options;

  const keywordList = Object.values(store.keywordMetrics);
  const campaignList = Object.values(store.campaignMetrics);

  const wastedKeywords = keywordList.filter((k) => {
    return (
      k.clicks >= wastedClicksMin &&
      k.sales === 0 &&
      k.spend >= wastedSpendMin
    );
  });

  const scalingKeywords = keywordList.filter((k) => {
    return (
      k.sales > 0 &&
      k.roas >= scalingRoasMin &&
      k.spend > 0 &&
      // treat "low spend" as below account average spend
      k.spend <
        (keywordList.length
          ? keywordList.reduce((s, x) => s + x.spend, 0) / keywordList.length
          : k.spend + 1)
    );
  });

  const highACOSCampaigns = campaignList.filter((c) => {
    return c.spend > 0 && c.sales > 0 && c.acos >= highAcosThreshold;
  });

  const avgRoas =
    store.totalAdSpend > 0 ? store.totalAdSales / store.totalAdSpend : 0;

  const budgetCappedCampaigns = campaignList.filter((c) => {
    if (!c.budget || c.budget <= 0) return false;
    const roas = c.spend > 0 ? c.sales / c.spend : 0;
    const budgetUtilization = c.spend / c.budget;
    // Near or at budget limit, and performing at or above account ROAS.
    return budgetUtilization >= 0.9 && roas >= avgRoas;
  });

  return {
    wastedKeywords,
    scalingKeywords,
    highACOSCampaigns,
    budgetCappedCampaigns,
  };
}

