export interface PerformanceGuardInput {
  executionTimeMs: number;
}

export interface PerformanceGuardOutput {
  issues: string[];
}

export function runPerformanceGuardAgent(input: PerformanceGuardInput): PerformanceGuardOutput {
  const issues: string[] = [];
  if (input.executionTimeMs > 5000) {
    issues.push(`Metric pipeline execution time ${input.executionTimeMs.toFixed(0)}ms exceeds 5000ms threshold.`);
  }
  return { issues };
}

