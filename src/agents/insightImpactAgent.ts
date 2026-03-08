/**
 * Phase 22 — Insight Impact Scoring Engine.
 * Ranks insights by estimated business impact (waste, revenue opportunity, scalability, confidence).
 */

import type { VerifiedInsight } from './zenithTypes';
import type { ImpactScoredInsight, InsightPriority } from './zenithTypes';
import type { MemoryStore } from '@/app/audit/utils/reportParser';

const WASTE_WEIGHT = 0.4;
const REVENUE_LIFT_WEIGHT = 0.3;
const SCALABILITY_WEIGHT = 0.2;
const CONFIDENCE_WEIGHT = 0.1;

export function runInsightImpactAgent(
  insights: VerifiedInsight[],
  store: MemoryStore
): ImpactScoredInsight[] {
  const wasteTotal = Object.values(store.keywordMetrics)
    .filter((k) => k.clicks >= 10 && k.sales === 0)
    .reduce((s, k) => s + k.spend, 0);
  const totalSpend = store.totalAdSpend || 1;
  const totalSales = store.totalAdSales || 0;
  const avgRoas = totalSpend > 0 ? totalSales / totalSpend : 0;

  return insights.map((insight) => {
    let wasteSavings = 0;
    let revenueLift = 0;
    let roasImprovement = 0;
    const title = (insight.title || '').toLowerCase();
    const desc = (insight.description || '').toLowerCase();

    if (title.includes('waste') || title.includes('bleeding') || title.includes('negative') || desc.includes('zero sale')) {
      wasteSavings = Math.min(wasteTotal * 0.3, wasteTotal);
    }
    if (title.includes('scale') || title.includes('roas') || title.includes('opportunity')) {
      revenueLift = totalSales * 0.05;
      roasImprovement = Math.max(0, 1.5 - avgRoas) * 0.2;
    }
    if (title.includes('acos') || title.includes('efficiency')) {
      revenueLift = totalSales * 0.02;
      roasImprovement = 0.1;
    }

    const confidence = (insight.verificationScore ?? 0.9);
    const impactScore =
      WASTE_WEIGHT * Math.min(wasteSavings / (totalSpend * 0.1 || 1), 10) +
      REVENUE_LIFT_WEIGHT * Math.min(revenueLift / (totalSales * 0.05 || 1), 10) +
      SCALABILITY_WEIGHT * Math.min(roasImprovement * 10, 10) +
      CONFIDENCE_WEIGHT * confidence * 10;
    const normalized = Math.min(10, Math.max(0, impactScore));
    const estimatedProfitLift = wasteSavings + revenueLift;

    let priority: InsightPriority = 'medium';
    if (normalized >= 8) priority = 'critical';
    else if (normalized >= 6) priority = 'high';
    else if (normalized >= 4) priority = 'medium';
    else priority = 'low';

    return {
      insightId: insight.id,
      impactScore: Math.round(normalized * 10) / 10,
      estimatedProfitLift: Math.round(estimatedProfitLift * 100) / 100,
      priority,
    };
  });
}
