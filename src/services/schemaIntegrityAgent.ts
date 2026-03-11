export interface SchemaIntegrityInput {
  rows: any[];
}

export interface SchemaIntegrityOutput {
  status: 'ok' | 'error';
  missingFields: string[];
  issues: string[];
}

const REQUIRED_FIELDS = ['spend', 'sales7d', 'clicks', 'impressions', 'orders'] as const;

export function runSchemaIntegrityAgent(input: SchemaIntegrityInput): SchemaIntegrityOutput {
  const present = new Set<string>();
  for (const row of input.rows) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    REQUIRED_FIELDS.forEach((f) => {
      if (r[f] != null) present.add(f);
    });
  }

  const missingFields = REQUIRED_FIELDS.filter((f) => !present.has(f));
  const issues: string[] = [];
  if (missingFields.length > 0) {
    issues.push(`Schema integrity error: missing canonical fields after mapping: ${missingFields.join(', ')}.`);
  }

  return {
    status: missingFields.length === 0 ? 'ok' : 'error',
    missingFields,
    issues,
  };
}

