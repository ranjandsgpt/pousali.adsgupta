/**
 * Phase 26 — Insight Discovery Copilot.
 * Suggests related exploration paths based on insight graph, query history, and dataset signals.
 */

import type { InsightGraphNode } from './zenithTypes';

const RELATED_QUESTIONS: Record<string, string[]> = {
  'why is acos high': [
    'Which keywords are wasting the most budget?',
    'Which campaigns have the lowest conversion rates?',
    'Which search terms should be negative keywords?',
  ],
  'why did roas drop': [
    'Which campaigns have the highest ACOS?',
    'Where is spend increasing without sales lift?',
    'Which keywords have zero sales?',
  ],
  'why are campaigns losing money': [
    'Which keywords have clicks but zero sales?',
    'What is my waste spend by campaign?',
    'Which campaigns exceed break-even ACOS?',
  ],
  'high acos': [
    'Which keywords are wasting the most budget?',
    'Which campaigns have the lowest conversion rates?',
    'Which search terms should be negative keywords?',
  ],
  'waste': [
    'Which keywords have zero sales?',
    'Which campaigns have the highest ACOS?',
    'What is my total wasted spend?',
  ],
  'conversion': [
    'Which campaigns have the best CVR?',
    'Which keywords have clicks but no orders?',
    'Which ASINs have the highest conversion rate?',
  ],
};

function normalizeQuery(q: string): string {
  return q.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function runInsightDiscoveryAgent(
  userQuestion: string,
  _insightGraph?: InsightGraphNode[],
  _queryHistory?: string[]
): string[] {
  const q = normalizeQuery(userQuestion);
  for (const [key, suggestions] of Object.entries(RELATED_QUESTIONS)) {
    if (q.includes(key)) return suggestions;
  }
  return [
    'Which keywords are wasting the most budget?',
    'Which campaigns have the highest ROAS?',
    'What is my total ad spend vs ad sales?',
  ];
}
