/**
 * Step 3 — Metric Resolution Logic.
 * Priority: 1) System  2) SLM  3) Gemini  4) Reference library (CSV).
 * Lazy computation + dependency graph + memoization.
 */

import type { SystemMetricSource } from './amazonMetricsReference';
import {
  getReference,
  getComputeOrder,
  VALIDATION_TOLERANCE_PCT,
  type CalculationReferenceEntry,
} from './amazonMetricsReference';

export type ResolutionSource = 'system' | 'slm' | 'gemini' | 'reference';

export interface ResolvedMetricResult {
  value: number;
  source: ResolutionSource;
}

export interface UnavailableMetricResult {
  available: false;
  reason: string;
}

export type MetricResolutionResult = ResolvedMetricResult | UnavailableMetricResult;

/** Cache: metric key → resolved value (for memoization). */
const resolutionCache = new Map<string, { value: number; source: ResolutionSource }>();

/** Build cache key from metric name and context hash (e.g. store fingerprint). */
function cacheKey(metricName: string, contextKey: string): string {
  return `${contextKey}:${metricName.replace(/\s+/g, '_').toLowerCase()}`;
}

/** Simple formula evaluator for reference formulas (Spend, Sales, Clicks, Impressions, Orders, etc.). Exported for agents (e.g. Data Consistency) to use with validateWithReference. */
export function evaluateReferenceFormula(formula: string, data: SystemMetricSource): number | null {
  const f = formula.replace(/\s+/g, ' ');
  const keys = [
    'Spend', 'Sales', 'Clicks', 'Impressions', 'Orders', 'Total Sales',
    'Ad Spend', 'Ad Sales', '7 Day Total Sales', '7 Day Total Orders (#)', '7 Day Total Units (#)',
    'Units', 'Sessions', 'BuyBoxPercentage', 'Margin %', 'Budget',
  ];
  let expr = f;
  for (const k of keys) {
    const v = data[k] ?? data[k.replace(/\s+/g, '')];
    if (v !== undefined && typeof v === 'number') {
      const re = new RegExp(k.replace(/[()#]/g, '\\$&').replace(/\s+/g, '\\s+'), 'gi');
      expr = expr.replace(re, String(v));
    }
  }
  try {
    const sanitized = expr
      .replace(/\* 100/g, '* 100')
      .replace(/\/\s*(\d)/g, '/ $1')
      .replace(/Δ/g, '0');
    const fn = new Function(`return (${sanitized})`);
    const result = fn();
    return typeof result === 'number' && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

/**
 * Resolve metric in priority order: system → SLM → Gemini → reference.
 * Uses cache when contextKey is stable (memoization).
 */
export function resolveMetricWithPriority(
  metricName: string,
  systemValues: SystemMetricSource,
  slmValue: number | null,
  geminiValue: number | null,
  options?: { contextKey?: string; skipCache?: boolean }
): MetricResolutionResult {
  const ctxKey = options?.contextKey ?? 'default';
  const key = cacheKey(metricName, ctxKey);
  if (!options?.skipCache) {
    const cached = resolutionCache.get(key);
    if (cached) return cached;
  }

  const normalized = metricName.replace(/\s+/g, '_').toLowerCase();
  const systemKey = Object.keys(systemValues).find(
    (k) => k.replace(/\s+/g, '_').toLowerCase() === normalized
  );
  if (systemKey != null && typeof systemValues[systemKey] === 'number') {
    const result: ResolvedMetricResult = { value: systemValues[systemKey], source: 'system' };
    resolutionCache.set(key, result);
    return result;
  }

  if (slmValue != null && typeof slmValue === 'number' && Number.isFinite(slmValue)) {
    const result: ResolvedMetricResult = { value: slmValue, source: 'slm' };
    resolutionCache.set(key, result);
    return result;
  }

  if (geminiValue != null && typeof geminiValue === 'number' && Number.isFinite(geminiValue)) {
    const result: ResolvedMetricResult = { value: geminiValue, source: 'gemini' };
    resolutionCache.set(key, result);
    return result;
  }

  const entry = getReference(metricName);
  if (entry) {
    const computed = evaluateReferenceFormula(entry.formula, systemValues);
    if (computed != null) {
      const result: ResolvedMetricResult = { value: computed, source: 'reference' };
      resolutionCache.set(key, result);
      return result;
    }
  }

  return {
    available: false,
    reason: entry
      ? 'Dependencies missing for reference formula'
      : 'Metric not in system, SLM, Gemini, or reference library',
  };
}

/** Resolve multiple metrics in dependency order (dependencies first). */
export function resolveMetricsInOrder(
  metricNames: string[],
  systemValues: SystemMetricSource,
  getSlm: (name: string) => number | null,
  getGemini: (name: string) => number | null,
  contextKey?: string
): Map<string, MetricResolutionResult> {
  const order = getComputeOrder(metricNames);
  const results = new Map<string, MetricResolutionResult>();
  const expandedValues = { ...systemValues };
  for (const name of order) {
    const slm = getSlm(name);
    const gemini = getGemini(name);
    const resolved = resolveMetricWithPriority(name, expandedValues, slm, gemini, { contextKey });
    if ('value' in resolved) {
      expandedValues[name] = resolved.value;
      expandedValues[name.replace(/\s+/g, '_')] = resolved.value;
    }
    results.set(name, resolved);
  }
  return results;
}

/** Clear resolution cache (e.g. when store is replaced). */
export function clearResolutionCache(): void {
  resolutionCache.clear();
}

/** Validate using reference formula; flag if difference > 3%. */
export function validateWithReferenceTolerance(
  metricName: string,
  reportedValue: number,
  systemValues: SystemMetricSource,
  entry: CalculationReferenceEntry | undefined
): { valid: boolean; expected: number; differencePct: number; validationFlag: boolean } {
  if (!entry) {
    return { valid: false, expected: reportedValue, differencePct: 0, validationFlag: true };
  }
  const expected = evaluateReferenceFormula(entry.formula, systemValues);
  if (expected == null) {
    return { valid: false, expected: reportedValue, differencePct: 0, validationFlag: true };
  }
  const diff =
    reportedValue === 0
      ? (expected === 0 ? 0 : 100)
      : (Math.abs(reportedValue - expected) / Math.abs(reportedValue)) * 100;
  const validationFlag = diff > VALIDATION_TOLERANCE_PCT;
  return {
    valid: !validationFlag,
    expected,
    differencePct: diff,
    validationFlag,
  };
}

export { VALIDATION_TOLERANCE_PCT };
