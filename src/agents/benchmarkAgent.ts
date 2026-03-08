/**
 * Phase 27 — Agency Benchmark Intelligence.
 * Compares performance against industry benchmarks (ROAS, ACOS, CTR, CVR, CPC).
 */

import { getBenchmark } from '@/data/industryBenchmarks';

export interface BenchmarkResult {
  metric: string;
  yourValue: number;
  benchmarkValue: number;
  unit: string;
  performance: 'above' | 'at' | 'below';
  message: string;
}

export function runBenchmarkAgent(metrics: Record<string, number>): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];
  const metricKeys: Array<{ key: string; benchKey: string }> = [
    { key: 'roas', benchKey: 'ROAS' },
    { key: 'acos', benchKey: 'ACOS' },
    { key: 'ctr', benchKey: 'CTR' },
    { key: 'cvr', benchKey: 'CVR' },
    { key: 'cpc', benchKey: 'CPC' },
  ];

  for (const { key, benchKey } of metricKeys) {
    const value = metrics[key] ?? metrics[key.toUpperCase()];
    if (value == null) continue;
    const bench = getBenchmark(benchKey);
    if (!bench) continue;

    const yourValue = Number(value);
    const benchmarkValue = bench.average;
    let performance: 'above' | 'at' | 'below' = 'at';
    const tolerance = benchmarkValue * 0.1;
    if (bench.higherIsBetter) {
      if (yourValue > benchmarkValue + tolerance) performance = 'above';
      else if (yourValue < benchmarkValue - tolerance) performance = 'below';
    } else {
      if (yourValue < benchmarkValue - tolerance) performance = 'above';
      else if (yourValue > benchmarkValue + tolerance) performance = 'below';
    }
    const message =
      performance === 'above'
        ? `Above industry average (${benchmarkValue} ${bench.unit})`
        : performance === 'below'
          ? `Below industry average (${benchmarkValue} ${bench.unit})`
          : `In line with industry (${benchmarkValue} ${bench.unit})`;

    results.push({
      metric: benchKey,
      yourValue,
      benchmarkValue,
      unit: bench.unit,
      performance,
      message,
    });
  }
  return results;
}
