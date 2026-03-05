/**
 * Dual Engine Consensus Architecture — artifact types and verification.
 * Both SLM and Gemini produce metrics, tables, charts, insights.
 * Cross-verification yields confidence scores; only high-confidence artifacts are shown.
 */

export type ArtifactType = 'metrics' | 'tables' | 'charts' | 'insights';

/** Single KPI for metrics artifact */
export interface MetricItem {
  label: string;
  value: string | number;
  numericValue?: number;
  status?: 'good' | 'warn' | 'bad' | 'neutral';
}

/** Table artifact (serializable for verification) */
export interface TableArtifact {
  id: string;
  title: string;
  columns: { key: string; label: string; align?: string; format?: string }[];
  rows: Record<string, unknown>[];
}

/** Chart dataset (for verification: chart must align with table within 5%) */
export interface ChartDataPoint {
  name: string;
  value: number;
  label?: string;
}

export interface ChartArtifact {
  id: string;
  title: string;
  type: 'pie' | 'bar' | 'line';
  data: ChartDataPoint[] | { name: string; labels: string[]; values: number[] }[];
  tableRef?: string;
}

/** Insight with optional confidence and support */
export interface InsightArtifact {
  id: string;
  title: string;
  description: string;
  severity?: 'critical' | 'warning' | 'info' | 'opportunity';
  recommendedAction?: string;
  supportingMetrics?: string[];
  entityName?: string;
  entityType?: string;
}

/** Full artifact set from one engine */
export interface EngineArtifacts {
  metrics: MetricItem[];
  tables: TableArtifact[];
  charts: ChartArtifact[];
  insights: InsightArtifact[];
}

/** Verification scores returned by Gemini (validating SLM) or SLM (validating Gemini) */
export interface VerificationScores {
  metrics_score: number;
  tables_score: number;
  charts_score: number;
  insights_score: number;
}

/** Per-artifact-type confidence and selected source */
export interface ArtifactConfidence {
  metrics: { score: number; source: 'slm' | 'gemini' };
  tables: { score: number; source: 'slm' | 'gemini' };
  charts: { score: number; source: 'slm' | 'gemini' };
  insights: { score: number; source: 'slm' | 'gemini' };
}

/** Recovered fields from Gemini when SLM missed them */
export interface RecoveredFields {
  sessions?: number;
  buy_box_percentage?: number;
  units_ordered?: number;
  total_sales?: number;
  conversion_rate?: number;
}

/** Multi-agent validation result (Phase 2–5). */
export interface MultiAgentGateResult {
  gatePassed: boolean;
  minConfidence: number;
  financialMetricsAllowed: boolean;
}

/** Result of dual-engine run: validated artifacts + global confidence */
export interface DualEngineResult {
  slmArtifacts: EngineArtifacts;
  geminiArtifacts: EngineArtifacts | null;
  verificationSlmByGemini: VerificationScores | null;
  verificationGeminiBySlm: VerificationScores | null;
  confidence: ArtifactConfidence;
  validated: {
    metrics: MetricItem[];
    tables: TableArtifact[];
    charts: ChartArtifact[];
    insights: InsightArtifact[];
  };
  auditConfidenceScore: number;
  recoveredFields: RecoveredFields;
  /** Phase 2–5: multi-agent validation gate; recovered fields are already filtered to approved only when used. */
  multiAgentResult?: MultiAgentGateResult | null;
  ready: boolean;
}

/** Phase 6–7: Artifacts appear in UI only if confidence ≥ 0.80. */
export const CONFIDENCE_THRESHOLD = 0.8;
