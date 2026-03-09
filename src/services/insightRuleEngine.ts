import type { MemoryStore } from '@/app/audit/utils/reportParser';
import type { CanonicalMetrics } from './metricExecutionEngine';
import { runSanityChecks } from '@/app/audit/utils/sanityChecks';
import { runDiagnosticEngines } from '@/app/audit/engines';

export interface InsightRuleSummary {
  /** Human-readable insight messages suitable for UI or Gemini prompts. */
  insights: string[];
  counts: {
    wastedKeywords: number;
    missingExactKeywords: number;
    highAcosCampaigns: number;
    budgetLimitedCampaigns: number;
    duplicateKeywords: number;
  };
}

/**
 * Deterministic Insight Rule Engine.
 *
 * Consumes aggregated metrics (MemoryStore + CanonicalMetrics) and produces
 * a small list of human-readable insight summaries. No LLMs, no CSV rows.
 */
export function runInsightRuleEngine(
  store: MemoryStore,
  canonical: CanonicalMetrics,
  options?: {
    wastedKeywordSpendMin?: number;
    targetAcosPct?: number;
  }
): InsightRuleSummary {
  const wastedKeywordSpendMin = options?.wastedKeywordSpendMin ?? 30;
  const targetAcosPct = options?.targetAcosPct ?? 25;

  const sanity = runSanityChecks(store, {
    wastedSpendMin: wastedKeywordSpendMin,
  });
  const diagnostics = runDiagnosticEngines(store);

  const wastedKeywordsCount = sanity.wastedKeywords.length;
  const highAcosCampaignsCount = sanity.highACOSCampaigns.filter(
    (c) => c.acos > targetAcosPct * 1.5
  ).length;
  const budgetLimitedCampaignsCount = sanity.budgetCappedCampaigns.length;
  const duplicateKeywordsCount =
    diagnostics.campaignStructure.duplicateTargeting.length;

  // Missing exact match opportunities require a richer semantic model.
  // For now we expose a deterministic placeholder based on scaling keywords.
  const missingExactMatchCount = sanity.scalingKeywords.length;

  const insights: string[] = [];

  if (wastedKeywordsCount > 0) {
    insights.push(
      `${wastedKeywordsCount} keywords spent ≥ ${wastedKeywordSpendMin} with no sales.`
    );
  }

  if (missingExactMatchCount > 0) {
    insights.push(
      `${missingExactMatchCount} converting search terms look like candidates for exact-match keywords.`
    );
  }

  if (highAcosCampaignsCount > 0) {
    insights.push(
      `${highAcosCampaignsCount} campaigns have ACOS above ${(targetAcosPct * 1.5).toFixed(
        1
      )}%.`
    );
  }

  if (budgetLimitedCampaignsCount > 0) {
    insights.push(
      `${budgetLimitedCampaignsCount} campaigns appear budget limited but have strong ROAS.`
    );
  }

  if (duplicateKeywordsCount > 0) {
    insights.push(
      `${duplicateKeywordsCount} keyword groups are duplicated across multiple campaigns.`
    );
  }

  return {
    insights,
    counts: {
      wastedKeywords: wastedKeywordsCount,
      missingExactKeywords: missingExactMatchCount,
      highAcosCampaigns: highAcosCampaignsCount,
      budgetLimitedCampaigns: budgetLimitedCampaignsCount,
      duplicateKeywords: duplicateKeywordsCount,
    },
  };
}

