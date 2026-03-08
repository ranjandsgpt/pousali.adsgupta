/**
 * Node fallback when Python chart engine is unavailable.
 * Writes placeholder chart images so export pipeline can complete.
 * Same format as Python: { id, path, title }.
 */

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import type { PremiumState } from '@/agents/zenithTypes';
import type { RenderedChart } from './renderPremiumAssets';

// Minimal 1x1 PNG (transparent) as fallback image
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const FALLBACK_CHARTS: Array<{ id: string; title: string }> = [
  { id: 'spend-vs-roas', title: 'Spend vs ROAS' },
  { id: 'campaign-spend', title: 'Campaign Spend Distribution' },
  { id: 'acos-distribution', title: 'ACOS Distribution' },
  { id: 'profitability-waterfall', title: 'Profitability Waterfall' },
  { id: 'ad-vs-organic', title: 'Ad vs Organic Revenue' },
];

export async function renderChartsNodeFallback(
  _premiumState: PremiumState,
  outputDir: string
): Promise<RenderedChart[]> {
  const dir = path.resolve(outputDir);
  await mkdir(dir, { recursive: true });

  const chartTasks = FALLBACK_CHARTS.map(async ({ id, title }) => {
    const filePath = path.join(dir, `${id}.png`);
    try {
      await writeFile(filePath, TINY_PNG);
      return { id, path: filePath, title };
    } catch (e) {
      console.warn('Node fallback write failed for', id, e);
      return null;
    }
  });

  const results = await Promise.all(chartTasks);
  return results.filter((r): r is RenderedChart => r !== null);
}
