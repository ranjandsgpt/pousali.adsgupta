/**
 * Verification Guild — judge result contract.
 * Each judge returns score 0–1 and optional issues.
 */

export interface JudgeResult {
  score: number;
  issues: string[];
  level: string;
}

export const VERIFICATION_LEVELS = [
  'level1_deterministic',
  'level2_semantic',
  'evidence_engine',
  'level3_knowledge_graph',
  'level4_behavioral',
  'level5_recursive_miss',
  'level6_intelligence',
  'level7_signal',
  'level8_auto_learning',
  'level9_historical',
  'level10_compliance',
] as const;

export type VerificationLevelId = (typeof VERIFICATION_LEVELS)[number];

/** Insight eligible for UI only when VerificationScore >= this. */
export const INSIGHT_ELIGIBILITY_THRESHOLD = 0.9;

/** CXO gate: only insights with score 10/10 (1.0) in final gate (we use >= 0.9 for eligibility). */
export const CXO_GATE_THRESHOLD = 0.9;
