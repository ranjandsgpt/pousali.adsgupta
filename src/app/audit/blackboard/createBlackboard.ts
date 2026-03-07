/**
 * Blackboard factory and helpers. Agents read/write to the same Blackboard instance.
 */

import type { Blackboard, SlmInsights, GeminiInsights } from './types';

export function createEmptyBlackboard(): Blackboard {
  return {
    rawReports: {},
    sanitizedReports: {},
    schemaMap: {},
    derivedMetrics: {},
    slmInsights: { metrics: [], tables: [], charts: [], insights: [] },
    geminiInsights: { metrics: [], tables: [], charts: [], insights: [] },
    verificationScores: {},
    anomalies: [],
    recommendations: [],
    eligibleInsights: [],
  };
}

/** Merge SLM artifacts into blackboard.slmInsights (write-only; no direct agent calls). */
export function writeSlmInsights(bb: Blackboard, slm: Partial<SlmInsights>): void {
  if (slm.metrics) bb.slmInsights.metrics = slm.metrics;
  if (slm.tables) bb.slmInsights.tables = slm.tables;
  if (slm.charts) bb.slmInsights.charts = slm.charts;
  if (slm.insights) bb.slmInsights.insights = slm.insights;
}

/** Merge Gemini artifacts into blackboard.geminiInsights. */
export function writeGeminiInsights(bb: Blackboard, gemini: Partial<GeminiInsights>): void {
  if (gemini.metrics) bb.geminiInsights.metrics = gemini.metrics;
  if (gemini.tables) bb.geminiInsights.tables = gemini.tables;
  if (gemini.charts) bb.geminiInsights.charts = gemini.charts;
  if (gemini.insights) bb.geminiInsights.insights = gemini.insights;
}

/** Append anomalies (e.g. from Mathematical Auditor). */
export function appendAnomalies(bb: Blackboard, records: Blackboard['anomalies']): void {
  bb.anomalies.push(...records);
}

/** Set verification score for a level (e.g. level1, level2, ... evidence, ... level10). */
export function setVerificationScore(bb: Blackboard, level: string, score: number): void {
  bb.verificationScores[level] = Math.max(0, Math.min(1, score));
}
