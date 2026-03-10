export interface DataCoverageInput {
  rowCount: number;
}

export interface DataCoverageOutput {
  rowCount: number;
  issues: string[];
}

export function runDataCoverageAgent(input: DataCoverageInput): DataCoverageOutput {
  const issues: string[] = [];
  if (input.rowCount < 10) {
    issues.push('Insufficient data: fewer than 10 rows loaded for this report.');
  }
  return { rowCount: input.rowCount, issues };
}

