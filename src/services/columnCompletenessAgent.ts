export interface ColumnCompletenessInput {
  presentCanonicalFields: string[];
}

export interface ColumnCompletenessOutput {
  status: 'ok' | 'error';
  missing: string[];
}

const REQUIRED_FIELDS = ['spend', 'sales7d', 'clicks', 'impressions', 'orders'];

export function runColumnCompletenessAgent(input: ColumnCompletenessInput): ColumnCompletenessOutput {
  const present = new Set(input.presentCanonicalFields);
  const missing = REQUIRED_FIELDS.filter((f) => !present.has(f));

  return {
    status: missing.length === 0 ? 'ok' : 'error',
    missing,
  };
}

