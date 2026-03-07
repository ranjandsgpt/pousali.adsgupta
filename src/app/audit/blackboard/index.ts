export type {
  Blackboard,
  RawReports,
  SanitizedReports,
  SchemaMap,
  DerivedMetrics,
  SlmInsights,
  GeminiInsights,
  VerificationScores,
  AnomalyRecord,
  RecommendationRecord,
  InsightEvidence,
  InsightWithEvidence,
} from './types';
export { createEmptyBlackboard, writeSlmInsights, writeGeminiInsights, appendAnomalies, setVerificationScore } from './createBlackboard';
export { runIngestionLayer, runVerificationAndConsensus, buildBlackboardRunVerification } from './pipeline';
export type { PipelineResult } from './pipeline';
