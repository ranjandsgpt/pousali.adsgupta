/**
 * Export Consistency Guard — ensure metrics are identical across UI, PPT, PDF.
 * All must come from PremiumState (Phase 26).
 */

import type { PremiumState } from '@/agents/zenithTypes';

export interface ConsistencyCheckResult {
  passed: boolean;
  mismatches?: Array<{ source: string; metric: string; value: unknown; expected: unknown }>;
}

/**
 * Compare a set of metric values (e.g. from generated PDF/PPTX) to PremiumState.
 */
export function checkExportConsistency(
  premiumState: PremiumState,
  exported: Array<{ label: string; value: string | number }>,
  sourceLabel: string
): ConsistencyCheckResult {
  const mismatches: ConsistencyCheckResult['mismatches'] = [];
  const byLabel: Record<string, string | number> = {};
  for (const m of premiumState.verifiedMetrics) {
    byLabel[m.label] = m.value;
  }
  for (const e of exported) {
    const expected = byLabel[e.label];
    if (expected === undefined) continue;
    const expStr = String(expected);
    const actStr = String(e.value);
    if (expStr !== actStr && Number(expected) !== Number(e.value)) {
      mismatches.push({ source: sourceLabel, metric: e.label, value: e.value, expected });
    }
  }
  return {
    passed: mismatches.length === 0,
    mismatches: mismatches.length ? mismatches : undefined,
  };
}
