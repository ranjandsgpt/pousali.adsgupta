/**
 * Phase 4–5: Confidence = (SLM_score + Gemini_score) / 2.
 * Artifact selection: use higher-confidence source; only show if confidence >= 0.75.
 * Phase 6: Recovered fields — use Gemini value when Gemini confidence > SLM.
 */

import type {
  EngineArtifacts,
  VerificationScores,
  ArtifactConfidence,
  RecoveredFields,
  DualEngineResult,
  MetricItem,
  TableArtifact,
  ChartArtifact,
  InsightArtifact,
} from './types';
import { CONFIDENCE_THRESHOLD } from './types';

/** SLM verifies Gemini outputs: recompute metrics, validate formulas (ACOS = spend/sales, ROAS = sales/spend). */
export function verifyGeminiBySlm(
  geminiArtifacts: EngineArtifacts,
  datasetSummary: { totalAdSpend: number; totalAdSales: number; totalStoreSales?: number }
): VerificationScores {
  let metrics_score = 1;
  let tables_score = 1;
  let charts_score = 1;
  let insights_score = 1;
  const { totalAdSpend, totalAdSales, totalStoreSales = 0 } = datasetSummary;
  const expectedAcos = totalAdSales > 0 ? (totalAdSpend / totalAdSales) * 100 : 0;
  const expectedRoas = totalAdSpend > 0 ? totalAdSales / totalAdSpend : 0;
  const acosMetric = geminiArtifacts.metrics.find((m) => m.label.toLowerCase().includes('acos'));
  const roasMetric = geminiArtifacts.metrics.find((m) => m.label.toLowerCase().includes('roas'));
  if (acosMetric != null && typeof acosMetric.numericValue === 'number') {
    const dev = Math.abs(acosMetric.numericValue - expectedAcos);
    if (expectedAcos > 0 && dev / expectedAcos > 0.1) metrics_score -= 0.2;
  }
  if (roasMetric != null && typeof roasMetric.numericValue === 'number') {
    const dev = Math.abs(roasMetric.numericValue - expectedRoas);
    if (expectedRoas > 0 && dev / expectedRoas > 0.1) metrics_score -= 0.2;
  }
  const spendMetric = geminiArtifacts.metrics.find((m) => m.label.toLowerCase().includes('spend'));
  if (spendMetric != null && typeof spendMetric.numericValue === 'number') {
    if (Math.abs(spendMetric.numericValue - totalAdSpend) / (totalAdSpend || 1) > 0.05) metrics_score -= 0.1;
  }
  if (geminiArtifacts.tables.length === 0) tables_score = 0.5;
  if (geminiArtifacts.charts.length === 0) charts_score = 0.5;
  if (geminiArtifacts.insights.length === 0) insights_score = 0.7;
  return {
    metrics_score: Math.max(0, Math.min(1, metrics_score)),
    tables_score: Math.max(0, Math.min(1, tables_score)),
    charts_score: Math.max(0, Math.min(1, charts_score)),
    insights_score: Math.max(0, Math.min(1, insights_score)),
  };
}

/** Chart matches table within 5%? Reduce chart confidence if not. */
function chartTableAlignmentScore(
  charts: ChartArtifact[],
  tables: TableArtifact[]
): number {
  if (charts.length === 0) return 1;
  let match = 0;
  for (const ch of charts) {
    if (!ch.tableRef) {
      match += 1;
      continue;
    }
    const tbl = tables.find((t) => t.id === ch.tableRef);
    if (!tbl) {
      match += 0.9;
      continue;
    }
    const firstSeries = ch.data && ch.data[0];
    const chValues = firstSeries && typeof firstSeries === 'object' && 'values' in firstSeries
      ? (firstSeries as { values: number[] }).values
      : null;
    const rowSums = tbl.rows.slice(0, chValues?.length ?? 0).map((r) => {
      const v = r.spend ?? r.sales ?? 0;
      return typeof v === 'number' ? v : 0;
    });
    const chSum = chValues?.reduce((a, b) => a + b, 0) ?? 0;
    const tblSum = rowSums.reduce((a, b) => a + b, 0);
    const ratio = tblSum > 0 ? chSum / tblSum : 1;
    if (ratio >= 0.95 && ratio <= 1.05) match += 1;
    else match += 0.7;
  }
  return charts.length > 0 ? match / charts.length : 1;
}

export function computeConfidence(
  verificationSlmByGemini: VerificationScores | null,
  verificationGeminiBySlm: VerificationScores | null,
  slmArtifacts: EngineArtifacts,
  geminiArtifacts: EngineArtifacts | null
): ArtifactConfidence {
  const geminiVer = verificationSlmByGemini || {
    metrics_score: 0.85,
    tables_score: 0.85,
    charts_score: 0.85,
    insights_score: 0.85,
  };
  const slmVer = verificationGeminiBySlm || (geminiArtifacts
    ? verifyGeminiBySlm(geminiArtifacts, {
        totalAdSpend: slmArtifacts.metrics.find((m) => m.label.includes('Ad Spend'))?.numericValue ?? 0,
        totalAdSales: slmArtifacts.metrics.find((m) => m.label.includes('Ad Sales'))?.numericValue ?? 0,
      })
    : { metrics_score: 0.9, tables_score: 0.9, charts_score: 0.9, insights_score: 0.9 });
  const chartPenalty = 1 - (chartTableAlignmentScore(slmArtifacts.charts, slmArtifacts.tables) * 0.5 + 0.5);
  const slmChartsScore = Math.max(0, (geminiVer.charts_score + slmVer.charts_score) / 2 - chartPenalty * 0.1);
  return {
    metrics: {
      score: (geminiVer.metrics_score + slmVer.metrics_score) / 2,
      source: geminiVer.metrics_score >= slmVer.metrics_score ? 'slm' : 'gemini',
    },
    tables: {
      score: (geminiVer.tables_score + slmVer.tables_score) / 2,
      source: geminiVer.tables_score >= slmVer.tables_score ? 'slm' : 'gemini',
    },
    charts: {
      score: slmChartsScore,
      source: geminiVer.charts_score >= slmVer.charts_score ? 'slm' : 'gemini',
    },
    insights: {
      score: (geminiVer.insights_score + slmVer.insights_score) / 2,
      source: geminiVer.insights_score >= slmVer.insights_score ? 'slm' : 'gemini',
    },
  };
}

/** Phase 7: Choose artifact with highest confidence; if below threshold, suppress (return []). */
function selectSource<T>(slm: T[], gemini: T[] | null, confidence: number, source: 'slm' | 'gemini'): T[] {
  if (confidence < CONFIDENCE_THRESHOLD) return [];
  return source === 'gemini' && gemini && gemini.length > 0 ? gemini : slm;
}

export function selectArtifacts(
  slmArtifacts: EngineArtifacts,
  geminiArtifacts: EngineArtifacts | null,
  confidence: ArtifactConfidence
): {
  metrics: MetricItem[];
  tables: TableArtifact[];
  charts: ChartArtifact[];
  insights: InsightArtifact[];
} {
  return {
    metrics: selectSource(slmArtifacts.metrics, geminiArtifacts?.metrics ?? null, confidence.metrics.score, confidence.metrics.source),
    tables: selectSource(slmArtifacts.tables, geminiArtifacts?.tables ?? null, confidence.tables.score, confidence.tables.source),
    charts: selectSource(slmArtifacts.charts, geminiArtifacts?.charts ?? null, confidence.charts.score, confidence.charts.source),
    insights: selectSource(slmArtifacts.insights, geminiArtifacts?.insights ?? null, confidence.insights.score, confidence.insights.source),
  };
}

export function mergeRecoveredFields(
  slmSessions: number,
  slmBuyBox: number,
  slmUnits: number,
  recovered: RecoveredFields,
  geminiConfidence: number,
  slmConfidence: number
): RecoveredFields {
  const out: RecoveredFields = {};
  if (recovered.sessions != null && (slmSessions <= 0 && recovered.sessions > 0) && geminiConfidence > slmConfidence) out.sessions = recovered.sessions;
  if (recovered.buy_box_percentage != null && (slmBuyBox <= 0 && recovered.buy_box_percentage > 0) && geminiConfidence > slmConfidence) out.buy_box_percentage = recovered.buy_box_percentage;
  if (recovered.units_ordered != null && (slmUnits <= 0 && recovered.units_ordered > 0) && geminiConfidence > slmConfidence) out.units_ordered = recovered.units_ordered;
  return out;
}

export function computeAuditConfidenceScore(confidence: ArtifactConfidence): number {
  const mean =
    (confidence.metrics.score + confidence.tables.score + confidence.charts.score + confidence.insights.score) / 4;
  return Math.round(mean * 100);
}
