/**
 * Multi-Agent Validation Pipeline.
 * Orchestrates Schema Intelligence, Statistical Validator, Data Consistency, and CFO Reconciliation.
 * Gates artifacts and recovered fields: only pass through when agent confidence ≥ 80%.
 */

import type { MemoryStore } from '../utils/reportParser';
import type { EngineArtifacts, RecoveredFields } from '../dualEngine/types';
import type { GeminiSchemaInference } from './schemaIntelligenceAgent';
import { runSchemaIntelligenceAgent } from './schemaIntelligenceAgent';
import { runStatisticalValidatorAgent } from './statisticalValidatorAgent';
import { runDataConsistencyAgent } from './dataConsistencyAgent';
import { runDataReconciliationEngine } from './dataReconciliationEngine';

export const MULTI_AGENT_CONFIDENCE_TARGET = 0.8;

export interface MultiAgentResult {
  /** Overall gate: all agents passed their target. */
  gatePassed: boolean;
  /** Minimum confidence across agents (0–1). */
  minConfidence: number;
  schema: { passed: boolean; confidence: number };
  statistical: { passed: boolean; confidence: number };
  consistency: { passed: boolean; confidence: number };
  reconciliation: { passed: boolean; confidence: number };
  /** Recovered fields that passed all agents; use for merge. */
  recoveredFieldsApproved: RecoveredFields;
  /** If false, do not show financial metrics in UI. */
  financialMetricsAllowed: boolean;
  /** When schema did not pass: raw headers with no mapping; caller may escalate to Gemini infer_schema. */
  schemaUnmappedHeaders: string[];
}

/**
 * Run all validation agents. Recovered fields are approved only if
 * Schema, Statistical, Consistency, and Reconciliation all pass.
 * When schemaInferences is provided (from Gemini escalation or structured response), schema confidence may reach ≥80%.
 */
export function runMultiAgentPipeline(
  store: MemoryStore,
  slmArtifacts: EngineArtifacts,
  geminiArtifacts: EngineArtifacts | null,
  recoveredFields: RecoveredFields,
  schemaInferences?: GeminiSchemaInference | null
): MultiAgentResult {
  const schemaResult = runSchemaIntelligenceAgent(store, schemaInferences);
  const statisticalResult = runStatisticalValidatorAgent(store);
  const consistencyResult = runDataConsistencyAgent(
    store,
    slmArtifacts.metrics,
    geminiArtifacts?.metrics ?? null
  );
  const reconciliationResult = runDataReconciliationEngine(store);

  const minConfidence = Math.min(
    schemaResult.schemaConfidence,
    statisticalResult.confidence,
    consistencyResult.confidence,
    reconciliationResult.confidence
  );
  const gatePassed = minConfidence >= MULTI_AGENT_CONFIDENCE_TARGET;
  const financialMetricsAllowed =
    reconciliationResult.passed && consistencyResult.passed && statisticalResult.passed;

  const recoveredFieldsApproved: RecoveredFields = {};
  if (gatePassed && Object.keys(recoveredFields).length > 0) {
    if (statisticalResult.passed && schemaResult.passed) {
      if (recoveredFields.sessions != null) recoveredFieldsApproved.sessions = recoveredFields.sessions;
      if (recoveredFields.buy_box_percentage != null) recoveredFieldsApproved.buy_box_percentage = recoveredFields.buy_box_percentage;
      if (recoveredFields.units_ordered != null) recoveredFieldsApproved.units_ordered = recoveredFields.units_ordered;
      if (recoveredFields.conversion_rate != null) recoveredFieldsApproved.conversion_rate = recoveredFields.conversion_rate;
      if (recoveredFields.total_sales != null) recoveredFieldsApproved.total_sales = recoveredFields.total_sales;
    }
  }

  return {
    gatePassed,
    minConfidence,
    schema: { passed: schemaResult.passed, confidence: schemaResult.schemaConfidence },
    statistical: { passed: statisticalResult.passed, confidence: statisticalResult.confidence },
    consistency: { passed: consistencyResult.passed, confidence: consistencyResult.confidence },
    reconciliation: { passed: reconciliationResult.passed, confidence: reconciliationResult.confidence },
    recoveredFieldsApproved,
    financialMetricsAllowed,
    schemaUnmappedHeaders: schemaResult.passed ? [] : schemaResult.unmappedHeaders,
  };
}
