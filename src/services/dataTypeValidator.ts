import { sanitizeNumeric } from '@/utils/sanitizeNumeric';

export interface DataTypeValidatorInput {
  rows: any[];
}

export interface DataTypeIssue {
  field: 'spend' | 'sales7d' | 'clicks' | 'impressions' | 'orders';
  rowIndex: number;
  rawValue: unknown;
}

export interface DataTypeValidatorOutput {
  issues: DataTypeIssue[];
}

function canParseNumeric(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  const num = sanitizeNumeric(value);
  return !Number.isNaN(num);
}

export function runDataTypeValidator(input: DataTypeValidatorInput): DataTypeValidatorOutput {
  const issues: DataTypeIssue[] = [];
  const fields: DataTypeIssue['field'][] = ['spend', 'sales7d', 'clicks', 'impressions', 'orders'];

  input.rows.forEach((row, index) => {
    if (!row || typeof row !== 'object') return;
    const r = row as any;
    for (const field of fields) {
      const raw =
        r[field] ??
        (field === 'sales7d' ? r['7 Day Total Sales'] : undefined) ??
        (field === 'spend' ? r.Spend ?? r.Cost : undefined) ??
        (field === 'clicks' ? r.Clicks : undefined) ??
        (field === 'impressions' ? r.Impressions : undefined) ??
        (field === 'orders' ? r.Orders ?? r['Total Order Items'] ?? r['Units Sold'] : undefined);
      if (!canParseNumeric(raw)) {
        issues.push({ field, rowIndex: index, rawValue: raw });
      }
    }
  });

  return { issues };
}

