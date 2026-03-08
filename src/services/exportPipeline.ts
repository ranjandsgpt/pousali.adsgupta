/**
 * Zenith Export Pipeline (Phase 11, 33).
 * Steps: 1 Sync models → 2 Build PremiumState → 3 renderPremiumAssets (Python) → 4 Create PPTX → 5 CXO Judge → 6 Retry → 7 Return assets.
 */

import path from 'path';
import type { MemoryStore } from '@/app/audit/utils/reportParser';
import { syncModels } from '@/agents/modelSyncController';
import type { SlmData, GeminiData } from '@/agents/modelSyncController';
import type { PremiumState } from '@/agents/zenithTypes';
import { runCxoJudgeAgent } from '@/agents/cxoJudgeAgent';
import { runStructuredInsightsAgent } from '@/agents/structuredInsightsAgent';
import { renderPremiumAssets } from './renderPremiumAssets';
import { setExportStatus } from './exportStatusStore';

const MAX_RETRIES = 2;

export interface ExportPipelineInput {
  store: MemoryStore;
  slm: SlmData;
  gemini: GeminiData;
  auditId?: string;
}

export interface ExportPipelineResult {
  premiumState: PremiumState;
  renderedCharts: Array<{ id: string; path: string; title: string }>;
  pptxBuffer?: ArrayBuffer;
  pdfBuffer?: ArrayBuffer;
  judgePassed: boolean;
  judgeStatus: string;
}

/**
 * Phase 33 — Render premium assets via Python engine.
 * PremiumState → Python (export_engine.py) → charts/images → used by PPTX step.
 */
export async function runRenderPremiumAssets(
  premiumState: PremiumState,
  outputDir: string
): Promise<{ charts: Array<{ id: string; path: string; title: string }> }> {
  setExportStatus('rendering', 'Generating charts…');
  const result = await renderPremiumAssets(premiumState, outputDir);
  return { charts: result.charts };
}

/**
 * Run full export pipeline. Builds PremiumState, runs Python render, then CXO Judge.
 */
export async function runExportPipeline(input: ExportPipelineInput): Promise<ExportPipelineResult> {
  const { store, slm, gemini, auditId = 'session' } = input;

  setExportStatus('queued', 'Preparing export…');

  const premiumState = syncModels(store, slm, gemini);
  const structuredInsights = runStructuredInsightsAgent(store);
  (premiumState as PremiumState).structuredInsights = structuredInsights;

  const projectRoot = typeof process !== 'undefined' && process.cwd ? process.cwd() : '.';
  const outputDir = path.join(projectRoot, 'export-cache', 'charts');

  const { charts: renderedCharts } = await runRenderPremiumAssets(premiumState, outputDir);

  setExportStatus('verifying', 'Verifying export…');

  const exportedMetrics = premiumState.verifiedMetrics
    .filter((m) => typeof m.value === 'number')
    .map((m) => ({ label: m.label, value: m.value as number }));

  let lastResult: { status: string } = { status: 'PASSED' };
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const judge = runCxoJudgeAgent(premiumState, exportedMetrics, {
      maxTableRows: 12,
      maxSlideWords: 120,
    });
    lastResult = judge;
    if (judge.status === 'PASSED') break;
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  setExportStatus('ready', 'Export ready');

  return {
    premiumState,
    renderedCharts,
    judgePassed: lastResult.status === 'PASSED',
    judgeStatus: lastResult.status,
  };
}
