/**
 * Zenith Export Pipeline (Phase 11).
 * Steps: 1 Sync models → 2 Build PremiumState → 3 Generate charts → 4 Create PPTX → 5 (Convert to PDF) → 6 CXO Judge → 7 Retry → 8 Return assets.
 */

import type { MemoryStore } from '@/app/audit/utils/reportParser';
import { syncModels } from '@/agents/modelSyncController';
import type { SlmData, GeminiData } from '@/agents/modelSyncController';
import type { PremiumState } from '@/agents/zenithTypes';
import { runCxoJudgeAgent } from '@/agents/cxoJudgeAgent';
import { runStructuredInsightsAgent } from '@/agents/structuredInsightsAgent';

const MAX_RETRIES = 2;

export interface ExportPipelineInput {
  store: MemoryStore;
  slm: SlmData;
  gemini: GeminiData;
}

export interface ExportPipelineResult {
  premiumState: PremiumState;
  pptxBuffer?: ArrayBuffer;
  pdfBuffer?: ArrayBuffer;
  judgePassed: boolean;
  judgeStatus: string;
}

/**
 * Run full export pipeline. Builds PremiumState, runs CXO Judge.
 * Actual PPTX/PDF generation is done in the API route (using existing generate-presentation-pptx or extended version).
 */
export async function runExportPipeline(input: ExportPipelineInput): Promise<ExportPipelineResult> {
  const { store, slm, gemini } = input;

  const premiumState = syncModels(store, slm, gemini);

  const structuredInsights = runStructuredInsightsAgent(store);
  (premiumState as PremiumState).structuredInsights = structuredInsights;

  const exportedMetrics = premiumState.verifiedMetrics
    .filter((m) => typeof m.value === 'number')
    .map((m) => ({ label: m.label, value: m.value as number }));

  let lastResult: { status: string } = { status: 'PASSED' };
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const judge = runCxoJudgeAgent(premiumState, exportedMetrics);
    lastResult = judge;
    if (judge.status === 'PASSED') break;
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return {
    premiumState,
    judgePassed: lastResult.status === 'PASSED',
    judgeStatus: lastResult.status,
  };
}
