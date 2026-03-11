/**
 * Self Verification Agent: orchestrates diagnostic checks across the pipeline
 * before metrics are finalized. Runs automatically when reports are uploaded or analysis runs.
 *
 * Metric calculations must only occur in metricExecutionEngine.ts.
 * Agents must never modify metric outputs.
 * Agents are verification-only.
 */

import {
  runMetricReconciliationAgent,
  reconciliationInputFromMetricInput,
  type ReconciliationInput,
  type ReconciliationOutput,
} from './metricReconciliationAgent';
import { runRowIntegrityAgent } from './rowIntegrityAgent';
import { runSchemaIntegrityAgent } from './schemaIntegrityAgent';
import { runAggregationConsistencyAgent } from './aggregationConsistencyAgent';
import { runColumnCompletenessAgent } from './columnCompletenessAgent';

export interface SelfVerificationInput {
  campaignReportRows?: any[];
  advertisedProductReportRows?: any[];
  targetingReportRows?: any[];
  searchTermReportRows?: any[];
  businessReportRows?: any[];
  parserRowCounts?: Record<string, number>;
  schemaRowCounts?: Record<string, number>;
  engineRowCounts?: Record<string, number>;
}

export interface SelfVerificationOutput {
  status: 'ok' | 'warning' | 'error';
  issues: string[];
  diagnostics: {
    rowCounts: Record<string, number>;
    perReportTotals: ReconciliationOutput['diagnostics']['perReportTotals'];
    schemaIssues: string[];
  };
  reconciliation: ReconciliationOutput;
}

function selfVerificationInputToReconciliationInput(input: SelfVerificationInput): ReconciliationInput {
  return {
    campaignReportRows: input.campaignReportRows,
    advertisedProductReportRows: input.advertisedProductReportRows,
    targetingReportRows: input.targetingReportRows,
    searchTermReportRows: input.searchTermReportRows,
    businessReportRows: input.businessReportRows,
    pipelineCounts:
      input.parserRowCounts || input.schemaRowCounts
        ? {
            parser: input.parserRowCounts,
            schema: input.schemaRowCounts,
          }
        : undefined,
  };
}

export function runSelfVerificationAgent(input: SelfVerificationInput): SelfVerificationOutput {
  const reconInput = selfVerificationInputToReconciliationInput(input);
  const reconciliation = runMetricReconciliationAgent(reconInput);

  const allAdRows = [
    ...(input.campaignReportRows ?? []),
    ...(input.advertisedProductReportRows ?? []),
    ...(input.targetingReportRows ?? []),
    ...(input.searchTermReportRows ?? []),
  ];

  const rowIntegrity = runRowIntegrityAgent({
    parserRowCounts: input.parserRowCounts,
    schemaRowCounts: input.schemaRowCounts,
    engineRowCounts: input.engineRowCounts,
  });

  const schemaIntegrity = runSchemaIntegrityAgent({ rows: allAdRows });

  const canonicalFields = ['spend', 'sales7d', 'clicks', 'impressions', 'orders'];
  const presentCanonicalFields =
    allAdRows.length > 0
      ? canonicalFields.filter((f) => allAdRows.some((row) => row && typeof row === 'object' && (row as any)[f] != null))
      : [];
  const columnCompleteness = runColumnCompletenessAgent({ presentCanonicalFields });

  const perReportTotals = reconciliation.diagnostics.perReportTotals;
  const aggregationConsistency = runAggregationConsistencyAgent({
    advertisedSpend: perReportTotals.advertisedProductReport?.spend ?? 0,
    targetingSpend: perReportTotals.targetingReport?.spend ?? 0,
    advertisedSales: perReportTotals.advertisedProductReport?.sales ?? 0,
    targetingSales: perReportTotals.targetingReport?.sales ?? 0,
    thresholdPercent: 2,
  });

  const issues: string[] = [...reconciliation.issues];
  rowIntegrity.issues.forEach((i) =>
    issues.push(`Row loss: ${i.reportType} parser rows (${i.parserRows}) != ${i.stage} rows (${i.stageRows}).`)
  );
  schemaIntegrity.issues.forEach((i) => issues.push(i));
  if (columnCompleteness.status === 'error') {
    issues.push(`Column completeness: missing required fields: ${columnCompleteness.missing.join(', ')}.`);
  }
  aggregationConsistency.issues.forEach((i) => issues.push(i));

  const schemaIssues: string[] = [...schemaIntegrity.issues];
  if (columnCompleteness.missing.length > 0) {
    schemaIssues.push(`Missing canonical fields: ${columnCompleteness.missing.join(', ')}`);
  }

  let status: SelfVerificationOutput['status'] = reconciliation.status;
  if (schemaIntegrity.status === 'error' || columnCompleteness.status === 'error') status = 'error';
  else if (rowIntegrity.issues.length > 0 || aggregationConsistency.issues.length > 0) {
    if (status !== 'error') status = 'warning';
  }

  const rowCounts: Record<string, number> = {
    ...(reconciliation.diagnostics.rowCounts as Record<string, number>),
  };

  return {
    status,
    issues,
    diagnostics: {
      rowCounts,
      perReportTotals: reconciliation.diagnostics.perReportTotals,
      schemaIssues,
    },
    reconciliation,
  };
}

/**
 * Build SelfVerificationInput from metric engine input shape (for integration).
 */
export function selfVerificationInputFromMetricInput(metricInput: {
  campaignReport?: any[];
  targetingReport?: any[];
  searchTermReport?: any[];
  advertisedProductReport?: any[];
  businessReport?: any[];
}): SelfVerificationInput {
  return {
    campaignReportRows: metricInput.campaignReport,
    advertisedProductReportRows: metricInput.advertisedProductReport,
    targetingReportRows: metricInput.targetingReport,
    searchTermReportRows: metricInput.searchTermReport,
    businessReportRows: metricInput.businessReport,
  };
}
