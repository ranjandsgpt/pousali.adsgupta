/**
 * Ingestion Agent — Guild 1. Sanitize raw CSV/XLSX: currency, decimals, percentages, missing values.
 * Writes to blackboard.sanitizedReports. Does not call other agents.
 */

import type { Blackboard } from '../blackboard';
import { sanitizeNumeric } from '../utils/sanitizeNumeric';

/** Normalize percentage string like "5,32%" or "<5%" to float (0.0532, 0.05). */
function parsePercent(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value <= 1 ? value : value / 100;
  if (value === null || value === undefined || value === '') return 0;
  let str = String(value).trim();
  str = str.replace(/%/g, '');
  str = str.replace(/^</, '').trim();
  str = str.replace(/,/g, '.');
  const num = parseFloat(str);
  if (Number.isNaN(num)) return 0;
  return num > 1 ? num / 100 : num;
}

/**
 * Run ingestion: normalize raw report values into sanitizedReports.
 * Accepts rawReports as Record<fileName, rows[]>. Each row is sanitized (currency, %, decimals).
 */
export function runIngestionAgent(bb: Blackboard): void {
  const out: Blackboard['sanitizedReports'] = {};
  for (const [fileName, data] of Object.entries(bb.rawReports)) {
    if (Array.isArray(data)) {
      out[fileName] = data.map((row: Record<string, unknown>) => {
        const sanitized: Record<string, unknown> = { _sourceFile: fileName };
        for (const [key, val] of Object.entries(row)) {
          if (key === '_sourceFile') continue;
          const str = String(val ?? '').trim();
          if (/%/.test(str) || /^<\d/.test(str)) {
            sanitized[key] = parsePercent(val);
          } else if (typeof val === 'string' && /[€£$,\d]/.test(val)) {
            sanitized[key] = sanitizeNumeric(val);
          } else if (val !== '' && val != null) {
            sanitized[key] = val;
          }
        }
        return sanitized;
      });
    } else {
      out[fileName] = data;
    }
  }
  bb.sanitizedReports = out;
}
