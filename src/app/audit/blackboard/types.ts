/**
 * Blackboard Communication Protocol.
 * Central structured data exchange. Agents read/write here; they do not call each other.
 */

import type { EngineArtifacts, InsightArtifact } from '../dualEngine/types';

/** Raw report content keyed by file name (e.g. CSV text or parsed rows). */
export type RawReports = Record<string, unknown>;

/** Sanitized report rows/keyed data after Ingestion Agent. */
export type SanitizedReports = Record<string, unknown>;

/** Schema map: report type / header alias → normalized field name. Phase 3: confidence and unmapped for Gemini fallback. */
export type SchemaMap = Record<string, {
  reportType: string;
  requiredFields: string[];
  headerToCanonical: Record<string, string>;
  /** 0–1; when < 0.8 caller may use Gemini infer_schema for unmapped headers. */
  confidence?: number;
  unmappedHeaders?: string[];
}>;

/** Derived metrics (e.g. intentGraph from Traffic & Intent Agent). */
export interface DerivedMetrics {
  intentGraph?: { highIntent: string[]; moderateIntent: string[]; exploratory: string[]; lowIntent: string[] };
  intentStrengthIndex?: Record<string, number>;
  [key: string]: unknown;
}

/** Engine outputs stored after parallel SLM/Gemini run. */
export interface SlmInsights {
  metrics: EngineArtifacts['metrics'];
  tables: EngineArtifacts['tables'];
  charts: EngineArtifacts['charts'];
  insights: InsightArtifact[];
}

export interface GeminiInsights {
  metrics: EngineArtifacts['metrics'];
  tables: EngineArtifacts['tables'];
  charts: EngineArtifacts['charts'];
  insights: InsightArtifact[];
}

/** Verification scores from each judge level (0–1). */
export type VerificationScores = Record<string, number>;

/** Anomaly record from Mathematical Auditor or other agents. */
export interface AnomalyRecord {
  id: string;
  type: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  source?: string;
  expected?: number;
  actual?: number;
  details?: Record<string, unknown>;
}

/** Recommendation with optional verification score (only ≥0.9 eligible for UI). */
export interface RecommendationRecord {
  id: string;
  insightId?: string;
  title: string;
  action: string;
  reason?: string;
  verificationScore?: number;
  entityName?: string;
  entityType?: string;
}

/** Evidence metadata attached to an insight by Evidence Engine Agent. */
export interface InsightEvidence {
  rows_supporting: number;
  total_spend?: number;
  total_sales?: number;
  dataset_source: string;
  verified: boolean;
  sample_row_ids?: string[];
}

/** Insight with optional evidence (after Evidence Engine). */
export interface InsightWithEvidence extends InsightArtifact {
  evidence?: InsightEvidence;
  verificationScore?: number;
}

export interface Blackboard {
  rawReports: RawReports;
  sanitizedReports: SanitizedReports;
  schemaMap: SchemaMap;
  derivedMetrics: DerivedMetrics;
  slmInsights: SlmInsights;
  geminiInsights: GeminiInsights;
  verificationScores: VerificationScores;
  anomalies: AnomalyRecord[];
  recommendations: RecommendationRecord[];
  /** Insights that passed Evidence Engine and verification (verified=true, score ≥ threshold). */
  eligibleInsights: InsightWithEvidence[];
}
