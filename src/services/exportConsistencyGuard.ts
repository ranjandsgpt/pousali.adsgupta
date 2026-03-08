/**
 * Export Consistency Guard — ensure metrics are identical across UI, PPT, PDF (Phase 26, 47).
 * Tolerance: 0.01%. If mismatch → FAILED_ACCURACY, trigger retry.
 */

import type { PremiumState } from '@/agents/zenithTypes';

export interface ConsistencyCheckResult {
  passed: boolean;
  mismatches?: Array<{ source: string; metric: string; value: unknown; expected: unknown }>;
}

const TOLERANCE_PCT = 0.0001; // 0.01%

function numericValue(v: string | number): number | null {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/%/g, ''));
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

/**
 * Compare a set of metric values to PremiumState with 0.01% tolerance (Phase 47).
 */
export function checkExportConsistency(
  premiumState: PremiumState,
  exported: Array<{ label: string; value: string | number }>,
  sourceLabel: string,
  options?: { tolerancePct?: number }
): ConsistencyCheckResult {
  const tolerance = options?.tolerancePct ?? TOLERANCE_PCT;
  const mismatches: ConsistencyCheckResult['mismatches'] = [];
  const byLabel: Record<string, string | number> = {};
  for (const m of premiumState.verifiedMetrics) {
    byLabel[m.label] = m.value;
  }
  for (const e of exported) {
    const expected = byLabel[e.label];
    if (expected === undefined) continue;
    const expNum = numericValue(expected);
    const actNum = numericValue(e.value);
    if (expNum == null || actNum == null) {
      if (String(expected) !== String(e.value)) {
        mismatches.push({ source: sourceLabel, metric: e.label, value: e.value, expected });
      }
      continue;
    }
    const diff = Math.abs(actNum - expNum);
    const allowed = Math.abs(expNum) * tolerance;
    if (diff > allowed) {
      mismatches.push({ source: sourceLabel, metric: e.label, value: e.value, expected });
    }
  }
  return {
    passed: mismatches.length === 0,
    mismatches: mismatches.length ? mismatches : undefined,
  };
}

/**
 * Phase 47 — Verify UI, PremiumState, PPT, PDF all match before release.
 * Returns combined result; if any source fails, passed is false.
 */
export function verifyExportConsistency(
  premiumState: PremiumState,
  sources: Array<{ label: string; source: string; values: Array<{ label: string; value: string | number }> }>
): ConsistencyCheckResult {
  const allMismatches: ConsistencyCheckResult['mismatches'] = [];
  for (const { source, values } of sources) {
    const result = checkExportConsistency(premiumState, values, source);
    if (result.mismatches) allMismatches.push(...result.mismatches);
  }
  return {
    passed: allMismatches.length === 0,
    mismatches: allMismatches.length ? allMismatches : undefined,
  };
}
