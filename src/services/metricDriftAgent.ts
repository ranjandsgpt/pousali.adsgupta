export interface MetricSnapshot {
  totalAdSpend: number;
  totalAdSales: number;
  totalStoreSales: number;
  totalClicks: number;
  totalImpressions: number;
  totalOrders: number;
}

export interface MetricDriftInput {
  current: MetricSnapshot;
  previous: MetricSnapshot | null;
  thresholdPercent?: number;
}

export interface MetricDriftIssue {
  metric: keyof MetricSnapshot;
  previous: number;
  current: number;
  driftPercent: number;
}

export interface MetricDriftOutput {
  issues: MetricDriftIssue[];
}

export function runMetricDriftAgent(input: MetricDriftInput): MetricDriftOutput {
  const { current, previous } = input;
  const threshold = input.thresholdPercent ?? 50;
  const issues: MetricDriftIssue[] = [];

  if (!previous) return { issues };

  (Object.keys(current) as (keyof MetricSnapshot)[]).forEach((key) => {
    const prev = previous[key];
    const curr = current[key];
    if (prev <= 0) return;
    const drift = (Math.abs(curr - prev) / prev) * 100;
    if (drift > threshold) {
      issues.push({ metric: key, previous: prev, current: curr, driftPercent: drift });
    }
  });

  return { issues };
}

