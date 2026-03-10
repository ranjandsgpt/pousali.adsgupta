import { normalizeHeader } from '@/app/audit/utils/headerMapper';

export interface SchemaDriftInput {
  headers: string[];
}

export interface SchemaDriftOutput {
  missingExpected: string[];
  unexpectedColumns: string[];
  warnings: string[];
}

const EXPECTED_COLUMNS = ['Spend', 'Clicks', 'Impressions', 'Orders'];

export function runSchemaDriftAgent(input: SchemaDriftInput): SchemaDriftOutput {
  const normalizedHeaders = new Set(input.headers.map((h) => normalizeHeader(h)));
  const expectedNormalized = EXPECTED_COLUMNS.map((h) => normalizeHeader(h));

  const missingExpected: string[] = [];
  expectedNormalized.forEach((norm, idx) => {
    if (!normalizedHeaders.has(norm)) missingExpected.push(EXPECTED_COLUMNS[idx]);
  });

  const unexpectedColumns: string[] = [];
  input.headers.forEach((h) => {
    const norm = normalizeHeader(h);
    if (!expectedNormalized.includes(norm)) unexpectedColumns.push(h);
  });

  const warnings: string[] = [];
  if (missingExpected.length > 0) {
    warnings.push(`Schema drift: missing expected columns: ${missingExpected.join(', ')}.`);
  }
  if (unexpectedColumns.length > 0) {
    warnings.push(`Schema drift: new/unexpected columns detected: ${unexpectedColumns.join(', ')}.`);
  }

  return { missingExpected, unexpectedColumns, warnings };
}

