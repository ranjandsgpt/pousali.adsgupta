export interface MissingValueAgentInput {
  rows: any[];
  fields?: string[];
}

export interface MissingValueIssue {
  field: string;
  nullShare: number;
}

export interface MissingValueAgentOutput {
  issues: MissingValueIssue[];
}

export function runMissingValueAgent(input: MissingValueAgentInput): MissingValueAgentOutput {
  const fields = input.fields ?? ['spend', 'sales7d', 'clicks', 'impressions', 'orders'];
  const counts: Record<string, { nulls: number; total: number }> = {};
  fields.forEach((f) => {
    counts[f] = { nulls: 0, total: 0 };
  });

  input.rows.forEach((row) => {
    if (!row || typeof row !== 'object') return;
    const r = row as any;
    fields.forEach((field) => {
      const v = r[field];
      if (v !== undefined) counts[field].total += 1;
      if (v === null || v === undefined || v === '') counts[field].nulls += 1;
    });
  });

  const issues: MissingValueIssue[] = [];
  Object.entries(counts).forEach(([field, { nulls, total }]) => {
    if (total === 0) return;
    const share = nulls / total;
    if (share > 0.2) {
      issues.push({ field, nullShare: share });
    }
  });

  return { issues };
}

