export interface NumericPrecisionIssue {
  field: 'spend' | 'sales7d' | 'clicks' | 'impressions' | 'orders';
  rowIndex: number;
  rawValue: unknown;
  decimals: number;
  suggested: number;
}

export interface NumericPrecisionInput {
  rows: any[];
}

export interface NumericPrecisionOutput {
  issues: NumericPrecisionIssue[];
}

function countDecimals(value: number): number {
  const s = value.toString();
  const idx = s.indexOf('.');
  return idx === -1 ? 0 : s.length - idx - 1;
}

export function runNumericPrecisionAgent(input: NumericPrecisionInput): NumericPrecisionOutput {
  const issues: NumericPrecisionIssue[] = [];
  const fields: NumericPrecisionIssue['field'][] = ['spend', 'sales7d', 'clicks', 'impressions', 'orders'];

  input.rows.forEach((row, index) => {
    if (!row || typeof row !== 'object') return;
    const r = row as any;
    for (const field of fields) {
      const raw = r[field];
      if (typeof raw !== 'number') continue;
      const decimals = countDecimals(raw);
      if (decimals > 4) {
        const suggested = Number(raw.toFixed(2));
        issues.push({ field, rowIndex: index, rawValue: raw, decimals, suggested });
      }
    }
  });

  return { issues };
}

