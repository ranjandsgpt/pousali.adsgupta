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
import { runDataTrustAgent } from '@/agents/dataTrustAgent';
import { runInsightImpactAgent } from '@/agents/insightImpactAgent';
import { runInsightGraphAgent } from '@/agents/insightGraphAgent';
import { renderPremiumAssets } from './renderPremiumAssets';
import { setExportStatus } from './exportStatusStore';
import { getCacheDir } from './exportCache';

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

const JUDGE_OPTIONS = {
  maxTableRows: 25,
  maxSlideWords: 180,
  maxPointsScatter: 600,
  maxCategoriesBar: 40,
};

/**
 * Run full export pipeline. Builds PremiumState, runs Python render, then CXO Judge.
 * Always updates export status (ready or error). Never blocks download on aesthetic failure.
 */
export async function runExportPipeline(input: ExportPipelineInput): Promise<ExportPipelineResult> {
  const { store, slm, gemini, auditId = 'session' } = input;
  setExportStatus('queued', 'Preparing export…');
  console.log('[exportPipeline] Started');

  try {
    const premiumState = syncModels(store, slm, gemini);
    const structuredInsights = runStructuredInsightsAgent(store);
    (premiumState as PremiumState).structuredInsights = structuredInsights;
    const dataTrustReport = runDataTrustAgent(store);
    (premiumState as PremiumState).dataTrustReport = dataTrustReport;
    (premiumState as PremiumState).impactScoredInsights = runInsightImpactAgent(premiumState.verifiedInsights, store);
    (premiumState as PremiumState).insightGraph = runInsightGraphAgent(premiumState.verifiedInsights);

    const outputDir = path.join(getCacheDir(), 'charts');

    setExportStatus('rendering', 'Generating charts…');
    const { charts: renderedCharts } = await runRenderPremiumAssets(premiumState, outputDir);
    console.log('[exportPipeline] Charts generated:', renderedCharts.length);

    setExportStatus('verifying', 'Verifying export…');
    const exportedMetrics = premiumState.verifiedMetrics
      .filter((m) => typeof m.value === 'number')
      .map((m) => ({ label: m.label, value: m.value as number }));

    let lastResult: { status: string } = { status: 'PASSED' };
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const judge = runCxoJudgeAgent(premiumState, exportedMetrics, {
        ...JUDGE_OPTIONS,
        retryMode: attempt > 0,
      });
      lastResult = judge;
      if (judge.status === 'PASSED' || judge.status === 'PASSED_WITH_WARNINGS') break;
      if (judge.status === 'FAILED_ACCURACY' || judge.status === 'FAILED_STORYLINE') {
        setExportStatus('error', judge.message ?? 'Export check failed');
        throw new Error(judge.message ?? judge.status);
      }
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    setExportStatus('ready', 'Export ready');
    console.log('[exportPipeline] Export ready');
    return {
      premiumState,
      renderedCharts,
      judgePassed: lastResult.status === 'PASSED',
      judgeStatus: lastResult.status,
    };
  } catch (e) {
    console.error('[exportPipeline] Error', e);
    setExportStatus('error', e instanceof Error ? e.message : 'Export failed');
    throw e;
  }
}
