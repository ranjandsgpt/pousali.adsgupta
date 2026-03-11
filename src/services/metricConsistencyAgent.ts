export interface MetricConsistencyInput {
  totalAdSales: number;
  totalStoreSales: number;
  organicSales: number;
  acosPercent: number;
}

export interface MetricConsistencyOutput {
  issues: string[];
}

export function runMetricConsistencyAgent(input: MetricConsistencyInput): MetricConsistencyOutput {
  const issues: string[] = [];

  if (input.totalAdSales > input.totalStoreSales && input.totalStoreSales > 0) {
    issues.push('Metric consistency: ad-attributed sales exceed total store sales.');
  }

  if (input.organicSales < 0) {
    issues.push('Metric consistency: organic sales computed as negative value.');
  }

  if (input.acosPercent > 500) {
    issues.push(`Metric consistency: ACOS ${input.acosPercent.toFixed(2)}% exceeds 500% threshold.`);
  }

  return { issues };
}
