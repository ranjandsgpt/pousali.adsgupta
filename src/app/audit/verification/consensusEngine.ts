/**
 * Consensus Engine — runs all verification judges (with Evidence Engine after L2), writes to Blackboard, computes final score.
 * Only insights with VerificationScore >= INSIGHT_ELIGIBILITY_THRESHOLD may appear in UI.
 */

import type { MemoryStore } from '../utils/reportParser';
import type { Blackboard } from '../blackboard';
import { setVerificationScore } from '../blackboard';
import { INSIGHT_ELIGIBILITY_THRESHOLD, VERIFICATION_LEVELS } from './types';
import {
  runDeterministicJudge,
  runSemanticJudge,
  runEvidenceEngineJudge,
  runKnowledgeGraphJudge,
  runBehavioralJudge,
  runRecursiveMissJudge,
  runIntelligenceJudge,
  runSignalJudge,
  runAutoLearningJudge,
  runHistoricalAlignmentJudge,
  runComplianceGuardJudge,
} from './judges';

export interface ConsensusResult {
  verificationScore: number;
  levelScores: Record<string, number>;
  eligibleInsightCount: number;
  allIssues: string[];
}

/**
 * Run the full Verification Guild in order: L1, L2, Evidence Engine, L3–L10.
 * Writes each level score to blackboard.verificationScores and sets blackboard.eligibleInsights
 * to Evidence-verified insights that meet the eligibility threshold.
 */
export function runVerificationGuild(store: MemoryStore, bb: Blackboard): ConsensusResult {
  const allIssues: string[] = [];
  const levelScores: Record<string, number> = {};

  const r1 = runDeterministicJudge(store, bb);
  setVerificationScore(bb, r1.level, r1.score);
  levelScores[r1.level] = r1.score;
  allIssues.push(...r1.issues);

  const r2 = runSemanticJudge(bb);
  setVerificationScore(bb, r2.level, r2.score);
  levelScores[r2.level] = r2.score;
  allIssues.push(...r2.issues);

  const { eligible, result: evidenceResult } = runEvidenceEngineJudge(store, bb);
  setVerificationScore(bb, evidenceResult.level, evidenceResult.score);
  levelScores[evidenceResult.level] = evidenceResult.score;
  allIssues.push(...evidenceResult.issues);

  const judges = [
    runKnowledgeGraphJudge,
    runBehavioralJudge,
    runRecursiveMissJudge,
    runIntelligenceJudge,
    runSignalJudge,
    runAutoLearningJudge,
    runHistoricalAlignmentJudge,
    runComplianceGuardJudge,
  ];
  for (const run of judges) {
    const res = run(bb);
    setVerificationScore(bb, res.level, res.score);
    levelScores[res.level] = res.score;
    allIssues.push(...res.issues);
  }

  const levels = VERIFICATION_LEVELS.filter((l) => levelScores[l] !== undefined);
  const verificationScore = levels.length > 0
    ? levels.reduce((s, l) => s + levelScores[l], 0) / levels.length
    : 0;

  eligible.forEach((i) => {
    i.verificationScore = verificationScore;
  });
  bb.eligibleInsights = eligible.filter((i) => (i.verificationScore ?? 0) >= INSIGHT_ELIGIBILITY_THRESHOLD);

  return {
    verificationScore,
    levelScores,
    eligibleInsightCount: bb.eligibleInsights.length,
    allIssues,
  };
}
