/**
 * Self-Healing Controller: map structured feedback + diagnostics to OverrideState.
 *
 * This controller does NOT modify deterministic formulas. It only decides which
 * report source and strategies (within the allowed variants) are safest to use.
 */

import type { MemoryStore } from '@/app/audit/utils/reportParser';
import type { CanonicalMetrics } from './metricExecutionEngine';
import type { OverrideState } from './overrideEngine';
import { runDataReconciliationEngine } from '@/app/audit/agents/dataReconciliationEngine';

export type FeedbackSignal = 'like' | 'dislike';

export interface MetricFeedbackContext {
  metricId: string;
  viewId?: string;
  timeRange?: { start: string; end: string };
}

export interface FeedbackEvent {
  signal: FeedbackSignal;
  reason?: 'wrong_total' | 'wrong_trend' | 'wrong_mapping' | 'misleading' | 'unclear' | 'other';
  comment?: string;
  metricContext: MetricFeedbackContext;
}

export interface SelfHealingContext {
  store: MemoryStore;
  metrics: CanonicalMetrics;
  feedback: FeedbackEvent;
}

export interface SelfHealingResult {
  overrides: OverrideState | null;
  explanation: string;
}

export function runSelfHealingController(ctx: SelfHealingContext): SelfHealingResult {
  const { store, metrics, feedback } = ctx;
  const overrides: OverrideState = {};

  // Only react to dislikes on numeric metrics.
  if (feedback.signal !== 'dislike') {
    return { overrides: null, explanation: 'Feedback was positive; no self-healing applied.' };
  }

  const reconciliation = runDataReconciliationEngine(store);

  // Heuristic 1: choose ad source that best reconciles with business report totals.
  if (
    feedback.metricContext.metricId === 'totalAdSales' ||
    feedback.metricContext.metricId === 'ACOS' ||
    feedback.metricContext.metricId === 'ROAS' ||
    feedback.metricContext.metricId === 'totalAdSpend'
  ) {
    const rt = store.reportTypeTotals;
    const totalStoreSales = metrics.totalStoreSales;

    const adv = rt?.advertised_product;
    const camp = rt?.campaign;

    const diff = (x?: { sales: number }) =>
      x ? Math.abs((x.sales ?? 0) - totalStoreSales) : Number.POSITIVE_INFINITY;

    const cand: Array<{ src: 'advertised_product' | 'campaign'; d: number }> = [];
    if (adv) cand.push({ src: 'advertised_product', d: diff(adv) });
    if (camp) cand.push({ src: 'campaign', d: diff(camp) });

    if (cand.length > 0) {
      cand.sort((a, b) => a.d - b.d);
      const best = cand[0];
      if (best.d < Number.POSITIVE_INFINITY) {
        overrides.adSourceOverride = best.src;
      }
    }
  }

  // Heuristic 2: if reconciliation flagged severe issues with totals, prefer residual organic strategy.
  if (!reconciliation.passed) {
    overrides.organicSplitStrategy = 'residual';
  }

  if (Object.keys(overrides).length === 0) {
    return {
      overrides: null,
      explanation: 'No safe self-healing override identified for this feedback event.',
    };
  }

  const explanationParts: string[] = [];
  if (overrides.adSourceOverride) {
    explanationParts.push(
      `Switched ad source to ${overrides.adSourceOverride} report to better align ad totals with store sales.`
    );
  }
  if (overrides.organicSplitStrategy === 'residual') {
    explanationParts.push('Using residual organic sales strategy (store - ad) for stability.');
  }

  return {
    overrides,
    explanation: explanationParts.join(' '),
  };
}

