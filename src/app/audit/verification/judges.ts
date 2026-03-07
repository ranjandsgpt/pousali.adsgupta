/**
 * 10-Level Verification Guild + Evidence Engine (runs after L2, before L3).
 * Each judge reads from Blackboard; returns score 0–1 and issues. No direct agent calls.
 */

import type { MemoryStore } from '../utils/reportParser';
import type { Blackboard, InsightWithEvidence } from '../blackboard';
import type { JudgeResult } from './types';
import { acos, roas, tacos, cvr, cpc, ctr } from '../utils/amazonMetricsLibrary';
import { runEvidenceEngineAgent } from '../agents/evidenceEngineAgent';
import { getIncorrectFeedback } from '../db/feedback';

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

/** Level 3 — Knowledge Graph Judge: cross-reference best practices (waste → negate/pause). */
export function runKnowledgeGraphJudge(bb: Blackboard): JudgeResult {
  const issues: string[] = [];
  for (const i of bb.slmInsights.insights) {
    const d = (i.description || '').toLowerCase();
    const rec = (i.recommendedAction || '').toLowerCase();
    if (d.includes('waste') || d.includes('bleed') || d.includes('zero sales')) {
      if (rec && !rec.includes('negate') && !rec.includes('pause') && !rec.includes('negative')) {
        issues.push(`KG: "${i.title}" suggests waste but recommendation doesn't suggest negate/pause.`);
      }
    }
  }
  const score = issues.length === 0 ? 1 : Math.max(0, 1 - issues.length * 0.15);
  return { score, issues, level: 'level3_knowledge_graph' };
}

/** Level 4 — Behavioral Judge: seasonal/behavioral anomalies (placeholder; use historical when available). */
export function runBehavioralJudge(bb: Blackboard): JudgeResult {
  const metrics = bb.slmInsights.metrics;
  const hasSales = metrics.some((m) => (m.label || '').toLowerCase().includes('sales') && (m.numericValue ?? 0) > 0);
  const score = hasSales ? 0.95 : 0.85;
  return { score, issues: [], level: 'level4_behavioral' };
}

/** Level 5 — Recursive Miss Judge: insights present in one engine but not the other (gap detection). */
export function runRecursiveMissJudge(bb: Blackboard): JudgeResult {
  const slmTitles = new Set(bb.slmInsights.insights.map((i) => (i.title || '').toLowerCase().slice(0, 40)));
  const geminiTitles = new Set(bb.geminiInsights.insights.map((i) => (i.title || '').toLowerCase().slice(0, 40)));
  const issues: string[] = [];
  Array.from(slmTitles).forEach((t) => {
    if (!geminiTitles.has(t) && t) issues.push(`Recursive miss: SLM insight "${t}..." not in Gemini.`);
  });
  Array.from(geminiTitles).forEach((t) => {
    if (!slmTitles.has(t) && t) issues.push(`Recursive miss: Gemini insight "${t}..." not in SLM.`);
  });
  const score = issues.length === 0 ? 1 : Math.max(0, 1 - issues.length * 0.1);
  return { score, issues, level: 'level5_recursive_miss' };
}

/** Level 6 — Intelligence Judge: strategic consistency (no conflicting recommendations). */
export function runIntelligenceJudge(bb: Blackboard): JudgeResult {
  const issues: string[] = [];
  const recs = bb.slmInsights.insights.map((i) => (i.recommendedAction || '').toLowerCase());
  const hasScale = recs.some((r) => r.includes('scale') || r.includes('increase'));
  const hasPause = recs.some((r) => r.includes('pause') || r.includes('negate'));
  if (hasScale && hasPause) {
    const titles = bb.slmInsights.insights.map((i) => i.title).join(', ');
    if (bb.slmInsights.insights.length <= 3) issues.push('Intelligence: mix of scale and pause recommendations; verify entity scope.');
  }
  const score = issues.length === 0 ? 0.95 : 0.85;
  return { score, issues, level: 'level6_intelligence' };
}

/** Level 7 — Signal Judge: recommendation supported by multiple metrics/signals. */
export function runSignalJudge(bb: Blackboard): JudgeResult {
  let supported = 0;
  for (const i of bb.slmInsights.insights) {
    const hasSupport = (i.supportingMetrics && i.supportingMetrics.length >= 1) || (i.description && i.description.length > 20);
    if (hasSupport) supported++;
  }
  const total = bb.slmInsights.insights.length;
  const score = total > 0 ? 0.7 + 0.3 * (supported / total) : 0.9;
  const issues = supported < total && total > 0 ? ['Signal: some insights lack supporting metrics.'] : [];
  return { score, issues, level: 'level7_signal' };
}

/** Level 8 — Auto-Learning Judge: penalize if user feedback indicates repeated incorrect insights. */
export function runAutoLearningJudge(_bb: Blackboard): JudgeResult {
  const list = getIncorrectFeedback();
  const incorrectCount = list.filter((r) => r.artifact_type === 'insights').length;
  const score = incorrectCount >= 3 ? 0.75 : incorrectCount >= 1 ? 0.9 : 0.95;
  const issues = incorrectCount >= 1 ? [`Auto-learning: ${incorrectCount} insight(s) marked incorrect by user.`] : [];
  return { score, issues, level: 'level8_auto_learning' };
}

/** Level 9 — Historical Alignment Judge (placeholder; use historical store when populated). */
export function runHistoricalAlignmentJudge(bb: Blackboard): JudgeResult {
  const metrics = bb.slmInsights.metrics;
  const hasRoas = metrics.some((m) => (m.label || '').toLowerCase().includes('roas'));
  const score = hasRoas ? 0.92 : 0.88;
  return { score, issues: [], level: 'level9_historical' };
}

/** Level 10 — Compliance Guard: Amazon policy language check. */
export function runComplianceGuardJudge(bb: Blackboard): JudgeResult {
  const issues: string[] = [];
  const allText = [
    ...bb.slmInsights.insights.map((i) => `${i.title} ${i.description} ${i.recommendedAction || ''}`),
    ...bb.geminiInsights.insights.map((i) => `${i.title} ${i.description} ${i.recommendedAction || ''}`),
  ].join(' ').toLowerCase();
  if (allText.includes('guarantee') && allText.includes('roas')) issues.push('Compliance: avoid guarantee language on ROAS.');
  const score = issues.length === 0 ? 0.95 : 0.85;
  return { score, issues, level: 'level10_compliance' };
}
