/**
 * 10-Level Verification Guild + Evidence Engine (runs after L2, before L3).
 * Each judge reads from Blackboard; returns score 0–1 and issues. No direct agent calls.
 */

import type { MemoryStore } from '../utils/reportParser';
import type { Blackboard, InsightWithEvidence } from '../blackboard';
import type { JudgeResult } from './types';
import { acos, roas, tacos, cvr, cpc, ctr } from '../utils/amazonMetricsLibrary';
import { runEvidenceEngineAgent } from '../agents/evidenceEngineAgent';

/** Level 1 — Deterministic Judge: recompute metrics with Python formulas, compare to AI outputs. */
export function runDeterministicJudge(store: MemoryStore, bb: Blackboard): JudgeResult {
  const issues: string[] = [];
  const totalSales = store.totalStoreSales || store.storeMetrics.totalSales;
  const totalClicks = store.totalClicks || Object.values(store.keywordMetrics).reduce((s, k) => s + k.clicks, 0);
  const totalOrders = store.totalOrders ?? 0;
  const expectedAcos = acos(store.totalAdSpend, store.totalAdSales);
  const expectedRoas = roas(store.totalAdSales, store.totalAdSpend);
  const expectedTacos = tacos(store.totalAdSpend, totalSales);
  const expectedCvr = cvr(totalOrders, totalClicks);
  const expectedCpc = cpc(store.totalAdSpend, totalClicks);
  const expectedCtr = ctr(totalClicks, store.totalImpressions || 0);
  let matches = 0;
  let total = 0;
  for (const m of bb.slmInsights.metrics) {
    const v = m.numericValue ?? (typeof m.value === 'number' ? m.value : null);
    if (v == null) continue;
    total++;
    const label = (m.label || '').toLowerCase();
    let expected: number | null = null;
    if (label.includes('acos')) expected = expectedAcos;
    else if (label.includes('roas')) expected = expectedRoas;
    else if (label.includes('tacos')) expected = expectedTacos;
    else if (label.includes('cvr') || label.includes('conversion')) expected = expectedCvr;
    else if (label.includes('cpc')) expected = expectedCpc;
    else if (label.includes('ctr')) expected = expectedCtr;
    if (expected != null && Math.abs((v - expected) / (expected || 1)) <= 0.05) matches++;
  }
  const score = total > 0 ? matches / total : 1;
  if (score < 1) issues.push('Deterministic: some SLM metrics deviate from formula recompute.');
  return { score, issues, level: 'level1_deterministic' };
}

/** Level 2 — Semantic Judge: recommendation logic (e.g. 0 sales → Negate). */
export function runSemanticJudge(bb: Blackboard): JudgeResult {
  const issues: string[] = [];
  for (const i of bb.slmInsights.insights) {
    const d = (i.description || '').toLowerCase();
    const rec = (i.recommendedAction || '').toLowerCase();
    if (d.includes('zero sales') || d.includes('0 sales') || d.includes('wasted')) {
      if (rec && !rec.includes('negate') && !rec.includes('pause') && !rec.includes('negative')) {
        issues.push(`Semantic: insight "${i.title}" suggests wasted/zero sales but recommendation doesn't suggest negate/pause.`);
      }
    }
  }
  const score = issues.length === 0 ? 1 : Math.max(0, 1 - issues.length * 0.2);
  return { score, issues, level: 'level2_semantic' };
}

/** Evidence Engine: run after Semantic Judge; filters to verified insights only. */
export function runEvidenceEngineJudge(store: MemoryStore, bb: Blackboard): { eligible: InsightWithEvidence[]; result: JudgeResult } {
  const eligible = runEvidenceEngineAgent(store, bb.slmInsights.insights, bb.geminiInsights.insights);
  const total = bb.slmInsights.insights.length + bb.geminiInsights.insights.length;
  const verifiedCount = eligible.length;
  const score = total > 0 ? verifiedCount / total : 1;
  const issues = total > verifiedCount ? [`Evidence: ${total - verifiedCount} insights could not be verified against dataset rows.`] : [];
  return {
    eligible,
    result: { score, issues, level: 'evidence_engine' },
  };
}

/** Level 3 — Knowledge Graph Judge: cross-reference best practices (stub). */
export function runKnowledgeGraphJudge(_bb: Blackboard): JudgeResult {
  return { score: 0.95, issues: [], level: 'level3_knowledge_graph' };
}

/** Level 4 — Behavioral Judge: seasonal anomalies (stub). */
export function runBehavioralJudge(_bb: Blackboard): JudgeResult {
  return { score: 0.95, issues: [], level: 'level4_behavioral' };
}

/** Level 5 — Recursive Miss Judge: insights missed by both engines (stub). */
export function runRecursiveMissJudge(_bb: Blackboard): JudgeResult {
  return { score: 0.9, issues: [], level: 'level5_recursive_miss' };
}

/** Level 6 — Intelligence Judge: strategic consistency (stub). */
export function runIntelligenceJudge(_bb: Blackboard): JudgeResult {
  return { score: 0.9, issues: [], level: 'level6_intelligence' };
}

/** Level 7 — Signal Judge: multiple signals support recommendation (stub). */
export function runSignalJudge(_bb: Blackboard): JudgeResult {
  return { score: 0.9, issues: [], level: 'level7_signal' };
}

/** Level 8 — Auto-Learning Judge: historical accepted/rejected (stub). */
export function runAutoLearningJudge(_bb: Blackboard): JudgeResult {
  return { score: 0.9, issues: [], level: 'level8_auto_learning' };
}

/** Level 9 — Historical Alignment Judge (stub). */
export function runHistoricalAlignmentJudge(_bb: Blackboard): JudgeResult {
  return { score: 0.9, issues: [], level: 'level9_historical' };
}

/** Level 10 — Compliance Guard: Amazon policies (stub). */
export function runComplianceGuardJudge(_bb: Blackboard): JudgeResult {
  return { score: 0.95, issues: [], level: 'level10_compliance' };
}
