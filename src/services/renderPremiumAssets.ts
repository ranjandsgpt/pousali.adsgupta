/**
 * Phase 33 — Render premium assets via Python engine.
 * Spawns export-engine/export_engine.py with PremiumState JSON; returns chart paths.
 */

import { spawn } from 'child_process';
import path from 'path';
import type { PremiumState } from '@/agents/zenithTypes';

export interface RenderedChart {
  id: string;
  path: string;
  title: string;
}

export interface RenderPremiumAssetsResult {
  charts: RenderedChart[];
  slides: Array<{ title: string; insightNarrative: string; chartPath: string; keyTakeaway: string }>;
  outputDir: string;
  error?: string;
}

/**
 * Call Python export_engine.py with PremiumState; returns charts and slide specs.
 * Uses child_process.spawn; stdin = PremiumState JSON, stdout = manifest JSON.
 */
export async function renderPremiumAssets(
  premiumState: PremiumState,
  outputDir: string
): Promise<RenderPremiumAssetsResult> {
  const projectRoot = typeof process !== 'undefined' && process.cwd ? process.cwd() : '.';
  const scriptPath = path.join(projectRoot, 'export-engine', 'export_engine.py');

  return new Promise((resolve) => {
    const payload = JSON.stringify({
      premiumState: JSON.parse(JSON.stringify(premiumState)),
      outputDir,
    });

    const proc = spawn('python3', [scriptPath], {
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    proc.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err) => {
      resolve({
        charts: [],
        slides: [],
        outputDir,
        error: err.message,
      });
    });

    proc.on('close', (code) => {
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
        const out = JSON.parse(stdout) as RenderPremiumAssetsResult;
        resolve(out);
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
