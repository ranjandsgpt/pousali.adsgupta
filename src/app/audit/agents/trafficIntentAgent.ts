/**
 * Traffic & Intent Agent — Guild 2. Intent signals from search terms; IntentStrengthIndex = CTR * CVR; behavioral clusters.
 * Writes to blackboard.derivedMetrics.intentGraph. Does not call other agents.
 */

import type { MemoryStore } from '../utils/reportParser';
import type { Blackboard } from '../blackboard';

/** Intent strength proxy: ROAS * (sales/clicks when clicks > 0). Higher = stronger intent. */
function intentStrengthIndex(roas: number, clicks: number, sales: number): number {
  if (clicks === 0) return 0;
  const cvrProxy = sales / clicks;
  return roas * Math.min(1, cvrProxy);
}

export function runTrafficIntentAgent(store: MemoryStore, bb: Blackboard): void {
  const highIntent: string[] = [];
  const moderateIntent: string[] = [];
  const exploratory: string[] = [];
  const lowIntent: string[] = [];
  const indexByKey: Record<string, number> = {};
  for (const [key, k] of Object.entries(store.keywordMetrics)) {
    const strength = intentStrengthIndex(k.roas, k.clicks, k.sales);
    indexByKey[key] = strength;
    const term = k.searchTerm?.slice(0, 60) || key;
    if (strength >= 3) highIntent.push(term);
    else if (strength >= 1) moderateIntent.push(term);
    else if (strength >= 0.3) exploratory.push(term);
    else lowIntent.push(term);
  }
  bb.derivedMetrics.intentGraph = { highIntent, moderateIntent, exploratory, lowIntent };
  bb.derivedMetrics.intentStrengthIndex = indexByKey;
}
