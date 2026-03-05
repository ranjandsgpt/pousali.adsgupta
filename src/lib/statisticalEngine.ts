/**
 * Step 8 — Statistical Engine.
 * Moving averages, trend slopes, growth rates, correlation, standard deviation, pareto, outlier detection.
 */

/** 7-day moving average (pass last N values, window 7). */
export function movingAverage(values: number[], window: number): number[] {
  if (window < 1 || values.length < window) return [];
  const out: number[] = [];
  for (let i = window - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = 0; j < window; j++) sum += values[i - j] ?? 0;
    out.push(sum / window);
  }
  return out;
}

/** Week-over-week growth rate (current - previous) / previous * 100. */
export function weekOverWeekGrowth(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/** Simple linear regression slope (trend). */
export function trendSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i] ?? 0;
    sumXY += i * (values[i] ?? 0);
    sumX2 += i * i;
  }
  const denom = n * sumX2 - sumX * sumX;
  return denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
}

/** Sample standard deviation. */
export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sqDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}

/** Pearson correlation between two series. */
export function correlation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = (x[i] ?? 0) - meanX;
    const dy = (y[i] ?? 0) - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

/** Pareto: cumulative share of total (e.g. top keywords contributing to 80% of spend). */
export function paretoCumulativeShare(sortedValues: number[]): number[] {
  const total = sortedValues.reduce((a, b) => a + b, 0);
  if (total === 0) return sortedValues.map(() => 0);
  let cum = 0;
  return sortedValues.map((v) => {
    cum += v;
    return (cum / total) * 100;
  });
}

/** Outlier detection: values outside mean ± (multiplier * stdDev). */
export function outlierIndices(values: number[], multiplier = 2): number[] {
  const std = standardDeviation(values);
  if (std === 0) return [];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const threshold = multiplier * std;
  return values.map((v, i) => (Math.abs(v - mean) > threshold ? i : -1)).filter((i) => i >= 0);
}
