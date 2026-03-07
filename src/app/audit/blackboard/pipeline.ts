/**
 * Agent pipeline orchestration. Agents run asynchronously; they read/write only to Blackboard.
 * Flow: Upload → Ingestion + Schema Guard → Parallel SLM/Gemini → Verification Guild → Consensus → Final Dataset.
 */

import type { MemoryStore } from '../utils/reportParser';
import type { Blackboard } from './types';
import type { EngineArtifacts } from '../dualEngine/types';
import { createEmptyBlackboard, writeSlmInsights, writeGeminiInsights } from './createBlackboard';
import { runIngestionAgent } from '../agents/ingestionAgent';
import { runSchemaGuardAgent } from '../agents/schemaGuardAgent';
import { runMathematicalAuditorAgent } from '../agents/mathematicalAuditorAgent';
import { runTrafficIntentAgent } from '../agents/trafficIntentAgent';
import { runVerificationGuild } from '../verification/consensusEngine';

export interface PipelineResult {
  blackboard: Blackboard;
  verificationScore: number;
  eligibleInsightCount: number;
}

/**
 * Run ingestion layer (Guild 1) on Blackboard. Call after rawReports is populated.
 */
export function runIngestionLayer(bb: Blackboard): void {
  runIngestionAgent(bb);
  runSchemaGuardAgent(bb);
}

/**
 * Run Verification Guild (10 levels + Evidence Engine after L2) and consensus.
 * Expects blackboard.slmInsights and blackboard.geminiInsights to be already written.
 */
export function runVerificationAndConsensus(store: MemoryStore, bb: Blackboard): PipelineResult {
  const consensus = runVerificationGuild(store, bb);
  return {
    blackboard: bb,
    verificationScore: consensus.verificationScore,
    eligibleInsightCount: consensus.eligibleInsightCount,
  };
}

/**
 * Build Blackboard from store and engine artifacts, run Verification Guild, return result.
 * Use this after SLM and Gemini have produced artifacts (parallel run done by caller).
 */
export function buildBlackboardRunVerification(
  store: MemoryStore,
  slmArtifacts: EngineArtifacts,
  geminiArtifacts: EngineArtifacts | null,
  rawReports?: Blackboard['rawReports']
): PipelineResult {
  const bb = createEmptyBlackboard();
  if (rawReports && Object.keys(rawReports).length > 0) {
    bb.rawReports = rawReports;
    runIngestionLayer(bb);
  }
  runMathematicalAuditorAgent(store, bb);
  runTrafficIntentAgent(store, bb);
  writeSlmInsights(bb, slmArtifacts);
  writeGeminiInsights(bb, geminiArtifacts || { metrics: [], tables: [], charts: [], insights: [] });
  return runVerificationAndConsensus(store, bb);
}
