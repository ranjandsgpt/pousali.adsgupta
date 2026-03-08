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
}

/**
 * Sync SLM + Gemini into a single PremiumState.
 * Fills gaps: if Gemini has insight but no chart, add chart placeholder/spec; if SLM has chart but no narrative, keep for Gemini later.
 */
export function syncModels(store: MemoryStore, slm: SlmData, gemini: GeminiData): PremiumState {
  const charts: ChartSpec[] = [...slm.charts];
  const tables: TableSpec[] = [...(slm.tableDatasets ?? [])];

  if (slm.chartMetadata?.length && charts.length === 0) {
    for (const meta of slm.chartMetadata) {
      charts.push({
        id: meta.id,
        type: meta.type,
        title: meta.title,
        dataset: Array.isArray(meta.dataset) ? (meta.dataset as Record<string, unknown>[]) : [],
      });
    }
  }

  const input: ZenithOrchestratorInput = {
    store,
    executiveNarrative: gemini.executiveNarrative,
    insights: gemini.insights,
    charts,
    tables,
  };

  return runZenithExportOrchestrator(input);
}

// Re-export for consumers that only need sync_models name
export const sync_models = syncModels;
