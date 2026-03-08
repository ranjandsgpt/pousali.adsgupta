/**
 * Phase 33 — Render premium assets via Python engine.
 * Phase 1 & 7: If Python unavailable or fails → Node fallback charts. Same format: { id, path, title }.
 */

import { spawn } from 'child_process';
import path from 'path';
import { mkdir } from 'fs/promises';
import type { PremiumState } from '@/agents/zenithTypes';
import { resolveChartSourcePriority } from './chartSourceResolver';
import { checkPythonAvailable } from './pythonAvailability';
import { renderChartsNodeFallback } from './renderChartsNodeFallback';

export interface RenderedChart {
  id: string;
  path: string;
  title: string;
}

export interface RenderPremiumAssetsResult {
  charts: RenderedChart[];
  slides: Array<{ title: string; insightNarrative: string; chartPath: string; keyTakeaway: string }>;
  outputDir: string;
  /** Phase 42: set when mode is 'pdf' and Python succeeds */
  pdfPath?: string;
  error?: string;
  /** True when Node fallback was used for charts */
  usedNodeFallback?: boolean;
}

const PYTHON_RENDER_TIMEOUT_MS = 8000;

function runPythonEngine(
  premiumState: PremiumState,
  outputDir: string,
  mode: 'charts' | 'pdf'
): Promise<RenderPremiumAssetsResult> {
  const projectRoot = typeof process !== 'undefined' && process.cwd ? process.cwd() : '.';
  const scriptPath = path.join(projectRoot, 'export-engine', 'export_engine.py');

  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      premiumState: JSON.parse(JSON.stringify(premiumState)),
      outputDir,
      mode,
    });

    const proc = spawn('python3', [scriptPath], {
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      clearTimeout(timeout);
      try {
        proc.kill('SIGTERM');
      } catch {
        //
      }
      reject(new Error('Python render timeout'));
    }, PYTHON_RENDER_TIMEOUT_MS);

    const clearTimeoutAndResolve = (result: RenderPremiumAssetsResult) => {
      clearTimeout(timeout);
      resolve(result);
    };

    proc.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    proc.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      resolve({
        charts: [],
        slides: [],
        outputDir,
        error: err.message,
      });
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0 && stderr) {
        resolve({
          charts: [],
          slides: [],
          outputDir,
          error: stderr.slice(0, 500),
        });
        return;
      }
      try {
        const out = JSON.parse(stdout) as RenderPremiumAssetsResult & { pdfPath?: string };
        clearTimeoutAndResolve({
          charts: out.charts ?? [],
          slides: out.slides ?? [],
          outputDir: out.outputDir ?? outputDir,
          pdfPath: out.pdfPath,
          error: out.error,
        });
      } catch {
        resolve({
          charts: [],
          slides: [],
          outputDir,
          error: 'Invalid JSON from Python engine',
        });
      }
    });

    proc.stdin?.write(payload, () => {
      proc.stdin?.end();
    });
  });
}

/**
 * Call Python export_engine.py with PremiumState; on failure use Node fallback for charts.
 * When mode is 'pdf', Python may return pdfPath; if not, caller should use Node PDF fallback.
 */
export async function renderPremiumAssets(
  premiumState: PremiumState,
  outputDir: string,
  options?: { mode?: 'charts' | 'pdf' }
): Promise<RenderPremiumAssetsResult> {
  const mode = options?.mode ?? 'charts';
  console.log('[renderPremiumAssets] Started, mode:', mode);
  await mkdir(outputDir, { recursive: true });
  resolveChartSourcePriority(premiumState);

  const pythonOk = await checkPythonAvailable();
  if (!pythonOk) {
    console.warn('[renderPremiumAssets] Python unavailable — using Node fallback');
    const charts = await renderChartsNodeFallback(premiumState, outputDir);
    console.log('[renderPremiumAssets] Charts generated (Node fallback):', charts.length);
    return {
      charts,
      slides: [],
      outputDir,
      usedNodeFallback: true,
    };
  }

  try {
    const result = await runPythonEngine(premiumState, outputDir, mode);
    console.log('[renderPremiumAssets] Python engine returned, charts:', result.charts?.length ?? 0);
    const hasCharts = result.charts.length > 0;
    const hasError = Boolean(result.error);

    if (hasError || !hasCharts) {
      console.warn('[renderPremiumAssets] Python failed or no charts — using Node fallback', result.error ?? '');
      const charts = await renderChartsNodeFallback(premiumState, outputDir);
      return {
        charts,
        slides: result.slides ?? [],
        outputDir: result.outputDir ?? outputDir,
        pdfPath: result.pdfPath,
        usedNodeFallback: true,
        error: result.error,
      };
    }
    return result;
  } catch (err) {
    console.warn('[renderPremiumAssets] Python timeout or error — using Node fallback', err);
    const charts = await renderChartsNodeFallback(premiumState, outputDir);
    return {
      charts,
      slides: [],
      outputDir,
      usedNodeFallback: true,
      error: err instanceof Error ? err.message : 'Python render failed',
    };
  }
}
