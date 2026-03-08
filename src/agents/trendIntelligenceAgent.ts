/**
 * Trend Intelligence Agent — Analyze performance trends.
 * Methods: moving averages, growth rate, trend slope.
 * Outputs: trendSignals, growthRate, performanceTrend.
 */

export interface TrendSignal {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  growthRate?: number;
  interpretation: string;
}

export interface TrendResult {
  trendSignals: TrendSignal[];
  growthRate: number;
  performanceTrend: string;
}

export interface TrendInput {
  current?: number;
  previous?: number;
  series?: number[];
  metricName?: string;
}

function growthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Compute trend signals and a short performance trend narrative.
 */
export function runTrendIntelligenceAgent(input: TrendInput): TrendResult {
  const { current = 0, previous = 0, series = [], metricName = 'metric' } = input;
  const signals: TrendSignal[] = [];
  let growth = 0;
  if (current !== undefined && previous !== undefined && previous !== 0) {
    growth = growthRate(current, previous);
    const direction: TrendSignal['direction'] = growth > 2 ? 'up' : growth < -2 ? 'down' : 'stable';
    signals.push({
      metric: metricName,
      direction,
      growthRate: growth,
      interpretation: growth > 2 ? `${metricName} increasing` : growth < -2 ? `${metricName} declining` : `${metricName} stable`,
    });
  }
  if (series.length >= 2) {
    const recent = series.slice(-3);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const slope = recent.length >= 2 ? (recent[recent.length - 1] - recent[0]) / recent.length : 0;
    const dir: TrendSignal['direction'] = slope > 0 ? 'up' : slope < 0 ? 'down' : 'stable';
    signals.push({
      metric: `${metricName} (series)`,
      direction: dir,
      growthRate: slope,
      interpretation: slope > 0 ? 'Trend improving' : slope < 0 ? 'Trend declining' : 'Trend flat',
    });
  }
  const performanceTrend = signals.length
    ? signals.map((s) => s.interpretation).join('. ')
    : 'Insufficient data for trend analysis.';
  return {
    trendSignals: signals,
    growthRate: growth,
    performanceTrend,
  };
}
