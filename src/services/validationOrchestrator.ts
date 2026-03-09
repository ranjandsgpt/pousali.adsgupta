/**
 * Self-Healing Pipeline: Orchestrate validation agents and return combined warnings.
 * Flow: metricExecutionEngine → validationOrchestrator → [ DataConsistency, StatisticalValidator, DiagnosticAgent ] → UI warnings.
 */

import type { MemoryStore } from '@/app/audit/utils/reportParser';
import type { CanonicalMetrics } from './metricExecutionEngine';
import { runDataConsistencyAgent } from '@/app/audit/agents/dataConsistencyAgent';
import { runStatisticalValidatorAgent } from '@/app/audit/agents/statisticalValidatorAgent';
import { runDiagnosticAgent, type ValidationReport } from './diagnosticAgent';

export interface ValidationWarning {
  source: 'consistency' | 'statistical' | 'diagnostic';
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface OrchestratorResult {
  warnings: ValidationWarning[];
  diagnosticReport: ValidationReport | null;
  consistencyPassed: boolean;
  statisticalPassed: boolean;
}

export async function runValidationOrchestrator(
  store: MemoryStore,
  canonical: CanonicalMetrics,
  options?: {
    slmMetrics?: { label: string; numericValue?: number }[];
    geminiMetrics?: { label: string; numericValue?: number }[] | null;
    headers?: string[];
    sampleRows?: Record<string, unknown>[];
  }
): Promise<OrchestratorResult> {
  const warnings: ValidationWarning[] = [];
  let diagnosticReport: ValidationReport | null = null;

  const slmMetrics = options?.slmMetrics ?? [];
  const geminiMetrics = options?.geminiMetrics ?? null;

  const consistencyResult = runDataConsistencyAgent(store, slmMetrics, geminiMetrics);
  if (!consistencyResult.passed) {
    consistencyResult.inconsistencies.forEach((msg) =>
      warnings.push({ source: 'consistency', message: msg, severity: 'warning' })
    );
  }

  const statisticalResult = runStatisticalValidatorAgent(store);
  if (!statisticalResult.passed) {
    statisticalResult.anomalies.forEach((a) =>
      warnings.push({
        source: 'statistical',
        message: `${a.metric}: ${a.reason}`,
        severity: a.severity === 'invalid' ? 'error' : 'warning',
      })
    );
  }

  if (options?.headers?.length) {
    diagnosticReport = await runDiagnosticAgent({
      headers: options.headers,
      sampleRows: options.sampleRows,
      canonicalMetrics: {
        totalAdSpend: canonical.totalAdSpend,
        totalAdSales: canonical.totalAdSales,
        totalStoreSales: canonical.totalStoreSales,
        organicSales: canonical.organicSales,
        acos: canonical.acos * 100,
        tacos: canonical.tacos * 100,
        roas: canonical.roas,
      },
    });
    if (diagnosticReport.status !== 'ok' && diagnosticReport.rootCause) {
      warnings.push({
        source: 'diagnostic',
        message: diagnosticReport.rootCause,
        severity: diagnosticReport.status === 'error' ? 'error' : 'warning',
      });
    }
  }

  return {
    warnings,
    diagnosticReport,
    consistencyPassed: consistencyResult.passed,
    statisticalPassed: statisticalResult.passed,
  };
}
