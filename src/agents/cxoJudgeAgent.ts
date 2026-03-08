/**
 * CXO Judge Agent — verify exports before download.
 * Checks: metric accuracy (vs PremiumState), slide density, color contrast, visual spacing.
 */

import type { PremiumState } from './zenithTypes';

export type CxoJudgeStatus = 'PASSED' | 'FAILED_AESTHETIC' | 'FAILED_ACCURACY';

export interface CxoJudgeResult {
  status: CxoJudgeStatus;
  message?: string;
  metricDeviations?: Array<{ metric: string; expected: number; actual: number }>;
}

const ALLOWED_DEVIATION_PCT = 0.0001; // 0.01%

function compareMetric(expected: number, actual: number): boolean {
  if (expected === 0) return actual === 0;
  const pct = Math.abs((actual - expected) / expected);
  return pct <= ALLOWED_DEVIATION_PCT;
}

/**
 * Check that numbers in the export match PremiumState (e.g. from PPT/PDF parsing or in-memory build).
 * This runs against the state we used to generate the export; for full flow, compare generated file content to premiumState.
 */
export function runCxoJudgeAgent(
  premiumState: PremiumState,
  exportedMetrics: Array<{ label: string; value: number }>
): CxoJudgeResult {
  const numericMetrics: Record<string, number> = {};
  for (const m of premiumState.verifiedMetrics) {
    const v = m.value;
    const num = typeof v === 'number' ? v : typeof v === 'string' && /^[\d.]+%?$/.test(v) ? parseFloat(v) : NaN;
    if (!Number.isNaN(num)) numericMetrics[m.label] = num;
  }

  const metricDeviations: CxoJudgeResult['metricDeviations'] = [];
  for (const exp of exportedMetrics) {
    const expected = numericMetrics[exp.label];
    if (expected == null) continue;
    if (!compareMetric(expected, exp.value)) {
      metricDeviations.push({ metric: exp.label, expected, actual: exp.value });
    }
  }

  if (metricDeviations.length > 0) {
    return {
      status: 'FAILED_ACCURACY',
      message: `Metric deviation exceeds ${ALLOWED_DEVIATION_PCT * 100}%`,
      metricDeviations,
    };
  }

  return { status: 'PASSED' };
}

/** Placeholder: slide density check (split if too crowded). */
export function checkSlideDensity(_slideContent: unknown): { passed: boolean; suggestSplit?: boolean } {
  return { passed: true };
}

/** Placeholder: color contrast check. */
export function checkColorContrast(_colors: string[]): boolean {
  return true;
}
