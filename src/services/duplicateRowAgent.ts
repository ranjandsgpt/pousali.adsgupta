import { normalizeDate } from '@/app/audit/utils/dateNormalizer';
import { sanitizeNumeric } from '@/utils/sanitizeNumeric';

export interface DuplicateRowAgentInput {
  rows: any[];
}

export interface DuplicateRowAgentOutput {
  duplicateCount: number;
  warnings: string[];
}

export function runDuplicateRowAgent(input: DuplicateRowAgentInput): DuplicateRowAgentOutput {
  const seen = new Set<string>();
  let duplicateCount = 0;

  for (const row of input.rows) {
    if (!row || typeof row !== 'object') continue;
    const campaignName = String((row as any).campaignName ?? (row as any).Campaign ?? '');
    const date = normalizeDate((row as any).date ?? (row as any).Date);
    const spend = sanitizeNumeric((row as any).spend ?? (row as any).Spend ?? (row as any).Cost);
    const clicks = sanitizeNumeric((row as any).clicks ?? (row as any).Clicks);
    const key = `${campaignName}|${date}|${spend}|${clicks}`;
    if (seen.has(key)) duplicateCount++;
    else seen.add(key);
  }

  const warnings: string[] = [];
  if (duplicateCount > 0) {
    warnings.push(`Detected ${duplicateCount} potential duplicate advertising rows (same campaign, date, spend, clicks).`);
  }

  return { duplicateCount, warnings };
}

