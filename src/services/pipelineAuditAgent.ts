import type { ReconciliationOutput } from './metricReconciliationAgent';

export interface PipelineAuditInput {
  rowIntegrity?: unknown;
  schemaIntegrity?: unknown;
  reconciliation?: ReconciliationOutput | null;
  anomalies?: unknown;
}

export interface PipelineAuditOutput {
  rowIntegrity: unknown;
  schemaIntegrity: unknown;
  reconciliation: ReconciliationOutput | null;
  anomalies: unknown;
}

export function runPipelineAuditAgent(input: PipelineAuditInput): PipelineAuditOutput {
  return {
    rowIntegrity: input.rowIntegrity ?? null,
    schemaIntegrity: input.schemaIntegrity ?? null,
    reconciliation: input.reconciliation ?? null,
    anomalies: input.anomalies ?? null,
  };
}

