/**
 * Phase 4 — Data Consistency Agent.
 * Verifies derived metrics: recalculate independently and compare with SLM/Gemini.
 * Uses CSV calculation reference for validation when available; tolerance 3%.
 * Confidence ≥ 80% before publishing.
 */

import type { MemoryStore } from '../utils/reportParser';
import { acos, roas, tacos, cvr, cpc, ctr } from '../utils/amazonMetricsLibrary';
import { getReference, validateWithReference } from '@/lib/amazonMetricsReference';
import { evaluateReferenceFormula } from '@/lib/metricResolution';

export const CONSISTENCY_CONFIDENCE_TARGET = 0.8;
/** Spec: validation tolerance 3% (reference and SLM/Gemini comparison). */
const MISMATCH_PCT_THRESHOLD = 3;

export interface DerivedCheck {
  metric: string;
  formula: string;
  computed: number;
  slmValue: number;
  geminiValue: number | null | undefined;
  slmMatch: boolean;
  geminiMatch: boolean;
  mismatchPct: number;
  /** Set when reference library formula disagrees with system (>3% deviation). */
  referenceValidationFlag?: boolean;
}

export interface DataConsistencyResult {
  passed: boolean;
  confidence: number;
  checks: DerivedCheck[];
  inconsistencies: string[];
}

function withinPct(a: number, b: number, pct: number): boolean {
  if (b === 0) return a === 0;
  const diff = Math.abs(a - b) / Math.abs(b);
  return diff <= pct / 100;
}

export function runDataConsistencyAgent(
  store: MemoryStore,
  slmMetrics: { label: string; numericValue?: number }[],
  geminiMetrics: { label: string; numericValue?: number }[] | null
): DataConsistencyResult {
  const totalSales = store.totalStoreSales || store.storeMetrics.totalSales;
  const totalClicks = store.totalClicks || Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);
  const totalOrders = store.totalOrders ?? 0;

  const computedAcos = acos(store.totalAdSpend, store.totalAdSales);
  const computedRoas = roas(store.totalAdSales, store.totalAdSpend);
  const computedTacos = tacos(store.totalAdSpend, totalSales);
  const computedCvr = cvr(totalOrders, totalClicks);
  const computedCpc = cpc(store.totalAdSpend, totalClicks);
  const computedCtr = ctr(totalClicks, store.totalImpressions);

  const getSlm = (label: string): number => {
    const m = slmMetrics.find((x) => x.label.toLowerCase().includes(label.toLowerCase()));
    return typeof m?.numericValue === 'number' ? m.numericValue : 0;
  };
  const getGemini = (label: string): number | null => {
    if (!geminiMetrics) return null;
    const m = geminiMetrics.find((x) => x.label.toLowerCase().includes(label.toLowerCase()));
    return typeof m?.numericValue === 'number' ? m.numericValue : null;
  };

  const checks: DerivedCheck[] = [];
  const inconsistencies: string[] = [];

  const totalAdSales = store.totalAdSales;
  const totalAdSpend = store.totalAdSpend;

  const baseMetrics = [
    { metric: 'Total Sales', formula: 'store', computed: totalSales, slmKey: 'total sales', geminiKey: 'total sales' },
    { metric: 'Total Ad Sales', formula: 'store', computed: totalAdSales, slmKey: 'ad sales', geminiKey: 'ad sales' },
    { metric: 'Ad Spend', formula: 'store', computed: totalAdSpend, slmKey: 'ad spend', geminiKey: 'ad spend' },
  ];

  const derived = [
    { metric: 'ACOS', formula: 'spend/ad_sales', computed: computedAcos, slmKey: 'acos', geminiKey: 'acos' },
    { metric: 'ROAS', formula: 'ad_sales/spend', computed: computedRoas, slmKey: 'roas', geminiKey: 'roas' },
    { metric: 'TACOS', formula: 'spend/total_sales', computed: computedTacos, slmKey: 'tacos', geminiKey: 'tacos' },
    { metric: 'CVR', formula: 'orders/clicks', computed: computedCvr, slmKey: 'conversion', geminiKey: 'cvr' },
    { metric: 'CPC', formula: 'spend/clicks', computed: computedCpc, slmKey: 'cpc', geminiKey: 'cpc' },
    { metric: 'CTR', formula: 'clicks/impressions', computed: computedCtr, slmKey: 'ctr', geminiKey: 'ctr' },
  ];

  // System values for reference-library validation (CSV formulas use Spend, Sales, Clicks, etc.)
  const systemValues: Record<string, number> = {
    Spend: totalAdSpend,
    'Ad Spend': totalAdSpend,
    Sales: totalAdSales,
    'Ad Sales': totalAdSales,
    'Total Sales': totalSales,
    Clicks: totalClicks,
    Impressions: store.totalImpressions ?? 0,
    Orders: totalOrders,
  };

  for (const d of [...baseMetrics, ...derived]) {
    const slmVal = getSlm(d.slmKey);
    const geminiVal = getGemini(d.geminiKey);
    const slmMatch = withinPct(d.computed, slmVal, MISMATCH_PCT_THRESHOLD);
    const geminiMatch = geminiVal == null ? true : withinPct(d.computed, geminiVal, MISMATCH_PCT_THRESHOLD);
    const mismatchPct = slmVal !== 0 ? Math.abs(d.computed - slmVal) / Math.abs(slmVal) * 100 : 0;

    // When CSV reference is loaded, validate system computed vs reference formula (3% tolerance)
    let referenceValidationFlag = false;
    if (getReference(d.metric)) {
      const refResult = validateWithReference(
        d.metric,
        d.computed,
        systemValues,
        evaluateReferenceFormula
      );
      referenceValidationFlag = refResult.validationFlag;
      if (referenceValidationFlag) {
        inconsistencies.push(
          `${d.metric}: reference formula deviation ${refResult.differencePct.toFixed(1)}% (expected ${refResult.expected?.toFixed(2) ?? '?'})`
        );
      }
    }

    checks.push({
      metric: d.metric,
      formula: d.formula,
      computed: d.computed,
      slmValue: slmVal,
      geminiValue: geminiVal ?? null,
      slmMatch,
      geminiMatch,
      mismatchPct,
      referenceValidationFlag,
    });
    if (!slmMatch) inconsistencies.push(`${d.metric}: SLM mismatch ${mismatchPct.toFixed(1)}%`);
    if (geminiVal != null && !geminiMatch) inconsistencies.push(`${d.metric}: Gemini mismatch`);
  }

  const matchCount = checks.filter((c) => c.slmMatch && (c.geminiValue == null || c.geminiMatch)).length;
  const confidence = checks.length > 0 ? matchCount / checks.length : 1;
  const passed = confidence >= CONSISTENCY_CONFIDENCE_TARGET;

  return {
    passed,
    confidence,
    checks,
    inconsistencies,
  };
}
