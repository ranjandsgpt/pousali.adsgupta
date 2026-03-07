/**
 * Phase 4: Seasonality Agent.
 */

import { getAccountHistory } from '../db/historicalStore';

export interface SeasonalityResult {
  score: number;
  issues: string[];
  level: string;
  dayOfWeekEffect?: number;
}

export function runSeasonalityAgent(accountId: string, window = 30): SeasonalityResult {
  const history = getAccountHistory(accountId, window);
  if (history.length < 7) return { score: 0.95, issues: [], level: 'seasonality' };
  const byDay = new Map<number, number[]>();
  for (const row of history) {
    const d = new Date(row.timestamp).getDay();
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(row.totalAdSales);
  }
  const dayMeans = Array.from(byDay.entries()).map(([, vals]) => vals.reduce((a, b) => a + b, 0) / vals.length);
  const overallMean = dayMeans.reduce((s, v) => s + v, 0) / dayMeans.length;
  const variance = dayMeans.reduce((s, v) => s + (v - overallMean) ** 2, 0) / dayMeans.length;
  const dayOfWeekEffect = overallMean > 0 ? Math.sqrt(variance) / overallMean : 0;
  const issues = dayOfWeekEffect > 0.2 ? ['Seasonality: significant day-of-week variation.'] : [];
  return { score: Math.max(0, 1 - issues.length * 0.1), issues, level: 'seasonality', dayOfWeekEffect };
}
