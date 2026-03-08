/**
 * Phase 27 — Industry benchmarks for agency comparison.
 * Compare ACOS, ROAS, CTR, CVR, CPC against typical ranges.
 */

export interface IndustryBenchmark {
  metric: string;
  unit: string;
  good: number;
  average: number;
  poor: number;
  /** good is lower-is-better (e.g. ACOS) or higher-is-better (e.g. ROAS) */
  higherIsBetter: boolean;
}

export const INDUSTRY_BENCHMARKS: IndustryBenchmark[] = [
  { metric: 'ROAS', unit: 'x', good: 3, average: 2, poor: 1, higherIsBetter: true },
  { metric: 'ACOS', unit: '%', good: 25, average: 35, poor: 50, higherIsBetter: false },
  { metric: 'CTR', unit: '%', good: 0.5, average: 0.3, poor: 0.1, higherIsBetter: true },
  { metric: 'CVR', unit: '%', good: 12, average: 8, poor: 4, higherIsBetter: true },
  { metric: 'CPC', unit: 'currency', good: 0.4, average: 0.7, poor: 1.2, higherIsBetter: false },
];

export function getBenchmark(metric: string): IndustryBenchmark | undefined {
  const key = metric.toUpperCase().replace(/\s/g, '');
  return INDUSTRY_BENCHMARKS.find((b) => b.metric.replace(/\s/g, '') === key);
}
