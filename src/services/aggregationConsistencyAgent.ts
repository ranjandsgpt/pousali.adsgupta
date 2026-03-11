export interface AggregationConsistencyInput {
  advertisedSpend: number;
  targetingSpend: number;
  advertisedSales: number;
  targetingSales: number;
  thresholdPercent?: number;
}

export interface AggregationConsistencyOutput {
  issues: string[];
}

export function runAggregationConsistencyAgent(input: AggregationConsistencyInput): AggregationConsistencyOutput {
  const threshold = input.thresholdPercent ?? 2;
  const issues: string[] = [];

  const pctDiff = (a: number, b: number) => (a > 0 ? (Math.abs(a - b) / a) * 100 : 0);

  if (input.advertisedSpend > 0 && input.targetingSpend > 0) {
    const d = pctDiff(input.advertisedSpend, input.targetingSpend);
    if (d > threshold) {
      issues.push(
        `Aggregation consistency: advertised vs targeting spend differ by ${d.toFixed(
          2
        )}% (threshold ${threshold}%).`
      );
    }
  }

  if (input.advertisedSales > 0 && input.targetingSales > 0) {
    const d = pctDiff(input.advertisedSales, input.targetingSales);
    if (d > threshold) {
      issues.push(
        `Aggregation consistency: advertised vs targeting sales differ by ${d.toFixed(
          2
        )}% (threshold ${threshold}%).`
      );
    }
  }

  return { issues };
}

