/**
 * Multi-Agent Validation Architecture.
 * Phase 2: Schema Intelligence Agent
 * Phase 3: Statistical Validator Agent
 * Phase 4: Data Consistency Agent
 * Phase 5: Data Reconciliation Engine (CFO Agent)
 * Pipeline: multiAgentPipeline
 */
export const AGENT_IDS = [
  'HeaderDiscoveryAgent',
  'CurrencyMappingAgent',
  'MathVerificationAgent',
  'SchemaIntelligenceAgent',
  'StatisticalValidatorAgent',
  'DataConsistencyAgent',
  'DataReconciliationEngine',
] as const;

export { runSchemaIntelligenceAgent } from './schemaIntelligenceAgent';
export { runStatisticalValidatorAgent } from './statisticalValidatorAgent';
export { runDataConsistencyAgent } from './dataConsistencyAgent';
export { runDataReconciliationEngine } from './dataReconciliationEngine';
export { runMultiAgentPipeline } from './multiAgentPipeline';
export { runEvidenceEngineAgent, verifyInsightWithEvidence } from './evidenceEngineAgent';
export { runIngestionAgent } from './ingestionAgent';
export { runSchemaGuardAgent } from './schemaGuardAgent';
export { runMathematicalAuditorAgent } from './mathematicalAuditorAgent';
export { runTrafficIntentAgent } from './trafficIntentAgent';
