/** Phase 4: Trend Agent. */
import type { HistoricalMetrics } from '../db/historicalTypes';
import { getMetricHistory } from '../db/historicalStore';
export function runTrendAgent(accountId: string, metricName: string, window = 7): HistoricalMetrics {
  const series = getMetricHistory(accountId, metricName, window);
  const values = series.map((r) => r.value);
  if (values.length < 2) return { trendSlope: 0, movingAverage: values[0] ?? 0, growthRate: 0, volatility: 0 };
  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((acc, y, i) => acc + i * y, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;
  const movingAverage = sumY / n;
  const first = values[0];
  const last = values[n - 1];
  const growthRate = first !== 0 ? (last - first) / first : 0;
  const variance = values.reduce((s, v) => s + (v - movingAverage) ** 2, 0) / n;
  const volatility = Math.sqrt(variance) || 0;
  return { trendSlope: slope, movingAverage, growthRate, volatility };
}
