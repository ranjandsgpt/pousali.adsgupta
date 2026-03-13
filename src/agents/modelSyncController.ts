/**
 * Model Sync Controller — synchronize SLM (charts/tables) + Gemini (narrative/insights) into unified PremiumState.
 * If Gemini insight exists but chart missing: generate chart metadata.
 * If SLM chart exists but Gemini explanation missing: can send to Gemini for reasoning (handled in pipeline).
 */

import type { PremiumState, ChartSpec, TableSpec } from './zenithTypes';
import { runZenithExportOrchestrator } from './zenithExportOrchestrator';
import type { ZenithOrchestratorInput } from './zenithExportOrchestrator';
import type { MemoryStore } from '@/app/audit/utils/reportParser';

export interface SlmData {
  charts: ChartSpec[];
  chartMetadata?: Array<{ id: string; type: string; title: string; dataset: unknown[] }>;
  tableDatasets?: TableSpec[];
}

export interface GeminiData {
  executiveNarrative: string;
  insights: Array<{ title: string; description: string; recommendedAction?: string; verificationScore?: number; sourceEngine?: 'slm' | 'gemini' }>;
  riskSignals?: string[];
  recommendations?: string[];
  metrics?: { label: string; numericValue?: number }[];
}

/**
 * Sync SLM + Gemini into a single PremiumState.
 * Fills gaps: if Gemini has insight but no chart, add chart placeholder/spec; if SLM has chart but no narrative, keep for Gemini later.
 */
export function syncModels(store: MemoryStore, slm: SlmData, gemini: GeminiData): PremiumState {
  const charts: ChartSpec[] = slm.charts.map((c) => ({ ...c, source: (c.source ?? 'slm') as 'slm' | 'gemini' | 'python' }));
  const tables: TableSpec[] = [...(slm.tableDatasets ?? [])];

  if (slm.chartMetadata?.length && charts.length === 0) {
    for (const meta of slm.chartMetadata) {
      charts.push({
        id: meta.id,
        type: meta.type,
        title: meta.title,
        dataset: Array.isArray(meta.dataset) ? (meta.dataset as Record<string, unknown>[]) : [],
        source: 'slm',
      });
    }
  }

  const conflicts: PremiumState['modelConflicts'] = [];
  if (gemini.metrics && gemini.metrics.length > 0) {
    const now = new Date().toISOString();
    for (const gm of gemini.metrics) {
      if (typeof gm.numericValue !== 'number' || !Number.isFinite(gm.numericValue)) continue;
      const label = gm.label;
      // SLM-first priority: find SLM metric with same label
      const slmMetric = slm.charts
        .flatMap((c) => c.dataset)
        .find((row) => (row as { label?: string }).label === label || (row as { name?: string }).name === label) as
        | { value?: number }
        | undefined;
      const slmValue = slmMetric && typeof slmMetric.value === 'number' ? slmMetric.value : undefined;
      if (slmValue == null) continue;
      const slmNum = slmValue;
      const gemNum = gm.numericValue;
      if (slmNum === 0) continue;
      const deviationPercent = Math.abs((slmNum - gemNum) / slmNum * 100);
      if (deviationPercent > 1) {
        conflicts.push({
          metric: label,
          slmValue: slmNum,
          geminiValue: gemNum,
          deviationPercent,
          winner: 'SLM',
          timestamp: now,
        });
        // eslint-disable-next-line no-console
        console.warn('[ModelSyncController] Metric conflict', {
          metric: label,
          slmValue: slmNum,
          geminiValue: gemNum,
          deviationPercent,
          winner: 'SLM',
        });
      }
    }
  }

  const input: ZenithOrchestratorInput = {
    store,
    executiveNarrative: gemini.executiveNarrative,
    insights: gemini.insights,
    charts,
    tables,
  };

  const premium = runZenithExportOrchestrator(input);
  if (conflicts.length > 0) {
    premium.modelConflicts = conflicts;
  }
  return premium;
}

// Re-export for consumers that only need sync_models name
export const sync_models = syncModels;
