/**
 * Phase 25 — Insight Story Engine.
 * Converts insights into consulting-grade narratives: Problem, Evidence, Impact, Recommendation.
 */

import type { VerifiedInsight } from './zenithTypes';
import type { InsightStory } from './zenithTypes';

export function runInsightStoryAgent(insight: VerifiedInsight, evidenceSummary?: string, impactSummary?: string): InsightStory {
  const title = insight.title || 'Performance issue';
  const desc = insight.description || '';
  const action = insight.recommendedAction || 'Review and optimize.';
  const evidence = evidenceSummary ?? desc.slice(0, 300);
  const impact = impactSummary ?? (desc.includes('waste') ? 'Budget is being spent without proportional return.' : 'Performance may be below target.');
  return {
    problem: title,
    evidence,
    impact,
    recommendation: action,
  };
}

export function runInsightStoryAgentBatch(
  insights: VerifiedInsight[],
  getEvidence?: (id: string) => string,
  getImpact?: (id: string) => string
): Map<string, InsightStory> {
  const map = new Map<string, InsightStory>();
  for (const i of insights) {
    map.set(i.id, runInsightStoryAgent(i, getEvidence?.(i.id), getImpact?.(i.id)));
  }
  return map;
}
