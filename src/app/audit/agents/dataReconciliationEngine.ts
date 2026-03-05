/**
 * Phase 5 — Data Reconciliation Engine (CFO Agent).
 * Ensures financial accuracy: SUM(keyword_sales) ≈ campaign_sales, etc.
 * No financial metric shown until reconciliation confidence ≥ 80%.
 */

import type { MemoryStore } from '../utils/reportParser';

export const RECONCILIATION_CONFIDENCE_TARGET = 0.8;
const TOLERANCE_PCT = 10;

export interface ReconciliationCheck {
  name: string;
  left: number;
  right: number;
  ratio: number;
  passed: boolean;
  detail: string;
}

export interface DataReconciliationResult {
  passed: boolean;
  confidence: number;
  checks: ReconciliationCheck[];
  failures: string[];
  /** When reconciliation failed: recommend SLM recompute and/or Gemini raw-report analysis. */
  recomputeRecommended: boolean;
}

function withinTolerance(a: number, b: number, pct: number): boolean {
  if (b === 0) return a === 0;
  const ratio = a / b;
  return ratio >= 1 - pct / 100 && ratio <= 1 + pct / 100;
}

export function runDataReconciliationEngine(store: MemoryStore): DataReconciliationResult {
  const checks: ReconciliationCheck[] = [];
  const failures: string[] = [];

  const keywordSpend = Object.values(store.keywordMetrics).reduce((s, k) => s + k.spend, 0);
  const keywordSales = Object.values(store.keywordMetrics).reduce((s, k) => s + k.sales, 0);
  const campaignSpend = Object.values(store.campaignMetrics).reduce((s, c) => s + c.spend, 0);
  const campaignSales = Object.values(store.campaignMetrics).reduce((s, c) => s + c.sales, 0);

  const accountSpend = store.totalAdSpend;
  const accountSales = store.totalAdSales;
  const totalStoreSales = store.totalStoreSales || store.storeMetrics.totalSales;

  // SUM(keyword_spend) ≈ campaign_spend
  const r1 = campaignSpend > 0 ? keywordSpend / campaignSpend : 1;
  const pass1 = withinTolerance(keywordSpend, campaignSpend, TOLERANCE_PCT);
  checks.push({
    name: 'Keyword spend vs campaign spend',
    left: keywordSpend,
    right: campaignSpend,
    ratio: r1,
    passed: pass1,
    detail: `Keyword total ${keywordSpend.toFixed(2)} vs campaign total ${campaignSpend.toFixed(2)}`,
  });
  if (!pass1) failures.push('Keyword spend does not reconcile with campaign spend');

  // SUM(keyword_sales) ≈ campaign_sales
  const r2 = campaignSales > 0 ? keywordSales / campaignSales : 1;
  const pass2 = withinTolerance(keywordSales, campaignSales, TOLERANCE_PCT);
  checks.push({
    name: 'Keyword sales vs campaign sales',
    left: keywordSales,
    right: campaignSales,
    ratio: r2,
    passed: pass2,
    detail: `Keyword total ${keywordSales.toFixed(2)} vs campaign total ${campaignSales.toFixed(2)}`,
  });
  if (!pass2) failures.push('Keyword sales does not reconcile with campaign sales');

  // SUM(campaign_spend) ≈ account spend
  const r3 = accountSpend > 0 ? campaignSpend / accountSpend : 1;
  const pass3 = withinTolerance(campaignSpend, accountSpend, TOLERANCE_PCT);
  checks.push({
    name: 'Campaign spend vs account spend',
    left: campaignSpend,
    right: accountSpend,
    ratio: r3,
    passed: pass3,
    detail: `Campaign total ${campaignSpend.toFixed(2)} vs account ${accountSpend.toFixed(2)}`,
  });
  if (!pass3) failures.push('Campaign spend does not reconcile with account spend');

  // SUM(campaign_sales) ≈ account sales
  const r4 = accountSales > 0 ? campaignSales / accountSales : 1;
  const pass4 = withinTolerance(campaignSales, accountSales, TOLERANCE_PCT);
  checks.push({
    name: 'Campaign sales vs account sales',
    left: campaignSales,
    right: accountSales,
    ratio: r4,
    passed: pass4,
    detail: `Campaign total ${campaignSales.toFixed(2)} vs account ${accountSales.toFixed(2)}`,
  });
  if (!pass4) failures.push('Campaign sales does not reconcile with account sales');

  // SUM(ad_sales) ≤ total_sales
  const pass5 = totalStoreSales >= 0 && accountSales <= totalStoreSales * 1.01;
  checks.push({
    name: 'Ad sales ≤ total store sales',
    left: accountSales,
    right: totalStoreSales,
    ratio: totalStoreSales > 0 ? accountSales / totalStoreSales : 0,
    passed: pass5,
    detail: `Ad sales ${accountSales.toFixed(2)} vs total ${totalStoreSales.toFixed(2)}`,
  });
  if (!pass5) failures.push('Ad sales exceeds total store sales');

  const passedCount = checks.filter((c) => c.passed).length;
  const confidence = checks.length > 0 ? passedCount / checks.length : 1;
  const passed = confidence >= RECONCILIATION_CONFIDENCE_TARGET;
  const recomputeRecommended = !passed && failures.length > 0;

  return {
    passed,
    confidence,
    checks,
    failures,
    recomputeRecommended,
  };
}
