import { normalizeHeader } from '@/app/audit/utils/headerMapper';

const KNOWN_HEADERS = [
  'Campaign Name',
  'Campaign',
  'Advertised SKU',
  'Advertised ASIN',
  'Customer Search Term',
  'Search Term',
  'Keyword Text',
  'Ordered Product Sales',
  'Spend',
  '7 Day Total Sales',
] as const;

export interface HeaderDetectionInput {
  lines: string[];
  maxScanRows?: number;
}

export interface HeaderDetectionOutput {
  headerIndex: number;
}

export function runHeaderDetectionAgent(input: HeaderDetectionInput): HeaderDetectionOutput {
  const maxRows = input.maxScanRows ?? 10;
  const normalizedKnown = KNOWN_HEADERS.map((h) => normalizeHeader(h));

  for (let i = 0; i < Math.min(maxRows, input.lines.length); i++) {
    const line = input.lines[i];
    if (!line || typeof line !== 'string') continue;
    const cells = line.split(',').map((c) => normalizeHeader(c.trim()));
    const match = cells.some((cell) => normalizedKnown.some((k) => cell === k || cell.includes(k) || k.includes(cell)));
    if (match) return { headerIndex: i };
  }

  return { headerIndex: 0 };
}

