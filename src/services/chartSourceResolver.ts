/**
 * Chart source priority: SLM → Gemini → Python.
 * Resolves which source to use per chart and records it in premiumState.chartSources.
 */

import type { PremiumState, ChartSpec, ChartSourceRecord, ChartSource } from '@/agents/zenithTypes';

const SOURCE_PRIORITY: ChartSource[] = ['slm', 'gemini', 'python'];

function priorityRank(s: ChartSource): number {
  const i = SOURCE_PRIORITY.indexOf(s);
  return i >= 0 ? i : SOURCE_PRIORITY.length;
}

/**
 * Resolve chart source per chart type/id. If SLM chart metadata exists use SLM;
 * else Gemini; else Python fallback. Mutates premiumState.chartSources.
 */
export function resolveChartSourcePriority(premiumState: PremiumState): void {
  const charts = premiumState.charts ?? [];
  const byKey = new Map<string, { chart: ChartSpec; source: ChartSource }>();

  for (const chart of charts) {
    const source = chart.source ?? 'python';
    const key = chart.type ? `${chart.type}:${chart.id}` : chart.id;
    const existing = byKey.get(key);
    if (!existing || priorityRank(source) < priorityRank(existing.source)) {
      byKey.set(key, { chart, source });
    }
  }

  premiumState.chartSources = Array.from(byKey.values()).map(({ chart, source }) => ({
    chartId: chart.id,
    chartType: chart.type,
    source,
  }));
}
