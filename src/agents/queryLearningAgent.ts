/**
 * Query Learning Agent — Learn from repeated user questions.
 * Track: frequent questions, failed queries, query gaps, successful patterns.
 * Improve routing over time.
 */

import { getQueryGaps, recordQueryGap } from './queryGapRegistry';

const successCount = new Map<string, number>();
const failCount = new Map<string, number>();
const MAX_PATTERNS = 500;

export function recordQuerySuccess(normalizedQuery: string, intent: string) {
  const key = `${intent}:${normalizedQuery.slice(0, 100)}`;
  successCount.set(key, (successCount.get(key) ?? 0) + 1);
  if (successCount.size > MAX_PATTERNS) {
    const first = successCount.keys().next().value;
    if (first) successCount.delete(first);
  }
}

export function recordQueryFailure(normalizedQuery: string, intent: string) {
  const key = `${intent}:${normalizedQuery.slice(0, 100)}`;
  failCount.set(key, (failCount.get(key) ?? 0) + 1);
  recordQueryGap(normalizedQuery, intent, 'unknown');
}

export function getFrequentPatterns(): Array<{ query: string; intent: string; successes: number }> {
  const out: Array<{ query: string; intent: string; successes: number }> = [];
  successCount.forEach((count, key) => {
    const [intent, query] = key.split(/:(.*)/).filter(Boolean);
    if (intent && query && count >= 2) out.push({ query, intent, successes: count });
  });
  return out.sort((a, b) => b.successes - a.successes).slice(0, 20);
}

export function getQueryGapsForLearning() {
  return getQueryGaps();
}
