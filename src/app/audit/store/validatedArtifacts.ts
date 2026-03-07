/**
 * Validated Artifact Store — Phase 1.
 * Only data that passed dual-engine verification and confidence threshold (≥0.8) is stored.
 * UI must read from this store instead of raw MemoryStore for metrics, tables, charts, insights.
 */

import type {
  MetricItem,
  TableArtifact,
  ChartArtifact,
  InsightArtifact,
  ArtifactConfidence,
  VerificationScores,
} from '../dualEngine/types';

export const VALIDATED_CONFIDENCE_THRESHOLD = 0.8;

export interface ValidatedArtifactsState {
  metrics: MetricItem[];
  tables: TableArtifact[];
  charts: ChartArtifact[];
  insights: InsightArtifact[];
  verificationScores: VerificationScores | null;
  confidence: number;
  /** Whether this snapshot passed verification (confidence >= threshold). */
  passed: boolean;
  /** Per-artifact confidence and source (SLM vs Gemini). */
  artifactConfidence: ArtifactConfidence | null;
}

const emptyVerificationScores: VerificationScores = {
  metrics_score: 0,
  tables_score: 0,
  charts_score: 0,
  insights_score: 0,
};

export const EMPTY_VALIDATED_ARTIFACTS: ValidatedArtifactsState = {
  metrics: [],
  tables: [],
  charts: [],
  insights: [],
  verificationScores: null,
  confidence: 0,
  passed: false,
  artifactConfidence: null,
};

export interface ValidatedArtifactsInput {
  metrics: MetricItem[];
  tables: TableArtifact[];
  charts: ChartArtifact[];
  insights: InsightArtifact[];
  verificationScores?: VerificationScores | null;
  confidence: number;
  artifactConfidence?: ArtifactConfidence | null;
}

/**
 * Build validated artifacts state. Only marks passed when confidence >= VALIDATED_CONFIDENCE_THRESHOLD.
 * confidence can be 0-1 or 0-100.
 */
export function buildValidatedArtifacts(input: ValidatedArtifactsInput): ValidatedArtifactsState {
  const passed = shouldAcceptValidatedArtifacts(input.confidence);
  return {
    metrics: input.metrics,
    tables: input.tables,
    charts: input.charts,
    insights: input.insights,
    verificationScores: input.verificationScores ?? null,
    confidence: input.confidence,
    passed,
    artifactConfidence: input.artifactConfidence ?? null,
  };
}

/**
 * Add validated artifact set only when confidence >= threshold (used by dual-engine pipeline).
 * @param confidence 0-1 (e.g. 0.8) or 0-100 (e.g. 80); both accepted.
 */
export function shouldAcceptValidatedArtifacts(confidence: number): boolean {
  const c = confidence > 1 ? confidence / 100 : confidence;
  return c >= VALIDATED_CONFIDENCE_THRESHOLD;
}
