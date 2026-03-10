export interface AggregationPathValidatorInput {
  rowsProcessed: number;
}

export interface AggregationPathValidatorOutput {
  status: 'ok' | 'error';
  issues: string[];
}

export function runAggregationPathValidator(input: AggregationPathValidatorInput): AggregationPathValidatorOutput {
  if (input.rowsProcessed > 0) {
    return { status: 'ok', issues: [] };
  }
  return {
    status: 'error',
    issues: ['Metric engine aggregation loop executed with zero rows processed.'],
  };
}

