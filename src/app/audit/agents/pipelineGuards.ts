import type { MemoryStore } from '../utils/reportParser';
import { runSchemaIntelligenceAgent } from './schemaIntelligenceAgent';
import { runStatisticalValidatorAgent } from './statisticalValidatorAgent';
import { runDataReconciliationEngine } from './dataReconciliationEngine';
import { runProfitabilityAgent } from './profitabilityAgent';

export class PipelineAbortError extends Error {
  constructor(
    public phase: string,
    public agent: string,
    public reason: string,
    public failedMetrics: Record<string, unknown>,
    public severity: 'critical' | 'warning'
  ) {
    super(`Pipeline aborted at ${phase} by ${agent}: ${reason}`);
    this.name = 'PipelineAbortError';
  }
}

export interface PipelineWarning {
  phase: string;
  agent: string;
  message: string;
  affectedMetrics: string[];
  severity: 'low' | 'medium';
}

const REQUIRED_FIELDS = ['spend', 'sales', 'impressions', 'clicks', 'orders'];

function checkSchemaGate(store: MemoryStore): void {
  const schema = runSchemaIntelligenceAgent(store);
  const lowRequired: Record<string, number> = {};
  for (const canonical of REQUIRED_FIELDS) {
    const mapping = schema.mappings.find((m) => m.canonical === canonical);
    if (mapping && mapping.confidence < 0.7) {
      lowRequired[canonical] = mapping.confidence;
    }
  }
  if (Object.keys(lowRequired).length > 0) {
    throw new PipelineAbortError(
      'Guild1',
      'SchemaIntelligenceAgent',
      'Low confidence mapping for required fields',
      lowRequired,
      'critical'
    );
  }
}

function computeSpendDeviation(store: MemoryStore): { deviationPct: number; keywordSpend: number; campaignSpend: number } {
  const campaignSpend = Object.values(store.campaignMetrics).reduce((s, c) => s + c.spend, 0);
  const keywordSpend = Object.values(store.keywordMetrics).reduce((s, k) => s + k.spend, 0);
  const diff = Math.abs(campaignSpend - keywordSpend);
  const deviationPct = campaignSpend > 0 ? diff / campaignSpend : 0;
  return { deviationPct, keywordSpend, campaignSpend };
}

function checkMathematicalGate(store: MemoryStore, warnings: PipelineWarning[]): void {
  const { deviationPct, keywordSpend, campaignSpend } = computeSpendDeviation(store);
  if (campaignSpend <= 0) return;
  if (deviationPct > 0.05) {
    throw new PipelineAbortError(
      'Guild2',
      'MathematicalAuditor',
      'Sum(SearchTermSpend) vs CampaignSpend deviation > 5%',
      { keywordSpend, campaignSpend, deviationPct },
      'critical'
    );
  }
  if (deviationPct >= 0.03 && deviationPct <= 0.05) {
    warnings.push({
      phase: 'Guild2',
      agent: 'MathematicalAuditor',
      message: 'Sum(SearchTermSpend) vs CampaignSpend deviation between 3–5%',
      affectedMetrics: ['Spend'],
      severity: 'medium',
    });
  }
}

const CORE_STAT_METRICS = new Set(['ACOS', 'ROAS', 'Spend', 'Sales']);

function checkStatisticalGate(store: MemoryStore, warnings: PipelineWarning[]): void {
  const result = runStatisticalValidatorAgent(store);
  if (!result.passed) {
    const coreFailures = result.anomalies.filter((a) => CORE_STAT_METRICS.has(a.metric));
    if (coreFailures.length > 0) {
      const failed: Record<string, { value: number; reason: string }> = {};
      coreFailures.forEach((a) => {
        failed[a.metric] = { value: a.value, reason: a.reason };
      });
      throw new PipelineAbortError(
        'Phase3',
        'StatisticalValidatorAgent',
        'Core metric validation failed',
        failed,
        'critical'
      );
    }
  }
  // Non-core anomalies become warnings.
  result.anomalies
    .filter((a) => !CORE_STAT_METRICS.has(a.metric))
    .forEach((a) => {
      warnings.push({
        phase: 'Phase3',
        agent: 'StatisticalValidatorAgent',
        message: `${a.metric}: ${a.reason}`,
        affectedMetrics: [a.metric],
        severity: 'medium',
      });
    });
}

function checkReconciliationAndProfitabilityGate(store: MemoryStore, warnings: PipelineWarning[]): void {
  const reconciliation = runDataReconciliationEngine(store);
  for (const check of reconciliation.checks) {
    const base = check.right !== 0 ? check.right : check.left;
    const deviation = base !== 0 ? Math.abs(check.left - check.right) / base : 0;
    const isSpendCheck =
      check.name === 'Campaign spend vs account spend' || check.name === 'Keyword spend vs campaign spend';
    if (isSpendCheck) {
      if (deviation > 0.05) {
        throw new PipelineAbortError(
          'Phase5',
          'DataReconciliationEngine',
          'Ad spend reconciliation deviation > 5%',
          { name: check.name, left: check.left, right: check.right, deviation },
          'critical'
        );
      }
      if (deviation >= 0.03 && deviation <= 0.05) {
        warnings.push({
          phase: 'Phase5',
          agent: 'DataReconciliationEngine',
          message: `${check.name} deviation between 3–5%`,
          affectedMetrics: ['Spend'],
          severity: 'medium',
        });
      }
    }
  }

  const { metrics } = runProfitabilityAgent(store);
  const totalSales = store.totalStoreSales || store.storeMetrics.totalSales;
  const grossProfit = metrics.grossProfit;
  if (totalSales < 0 || grossProfit < 0) {
    throw new PipelineAbortError(
      'Phase5',
      'ProfitabilityAgent',
      'Profitability denominators are negative',
      { totalSales, grossProfit },
      'critical'
    );
  }
}

export interface PipelineGuardsResult {
  warnings: PipelineWarning[];
  abort: PipelineAbortError | null;
}

export function runPipelineGuards(
  store: MemoryStore,
  options?: { noThrow?: boolean }
): PipelineWarning[] | PipelineGuardsResult {
  const warnings: PipelineWarning[] = [];
  const noThrow = options?.noThrow === true;
  try {
    checkSchemaGate(store);
    checkMathematicalGate(store, warnings);
    checkStatisticalGate(store, warnings);
    checkReconciliationAndProfitabilityGate(store, warnings);
    return noThrow ? { warnings, abort: null } : warnings;
  } catch (e) {
    if (noThrow && e instanceof PipelineAbortError) {
      return { warnings, abort: e };
    }
    throw e;
  }
}

