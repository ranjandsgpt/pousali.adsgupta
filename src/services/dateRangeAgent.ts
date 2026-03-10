import { normalizeDate } from '@/app/audit/utils/dateNormalizer';

export interface DateRangeAgentInput {
  campaignRows?: any[];
  advertisedProductRows?: any[];
  targetingRows?: any[];
  searchTermRows?: any[];
}

export interface DateRangeInfo {
  minDate: string | null;
  maxDate: string | null;
}

export interface DateRangeAgentOutput {
  ranges: {
    campaign?: DateRangeInfo;
    advertisedProduct?: DateRangeInfo;
    targeting?: DateRangeInfo;
    searchTerm?: DateRangeInfo;
  };
  issues: string[];
}

function extractRange(rows: any[] | undefined): DateRangeInfo | null {
  if (!rows || rows.length === 0) return null;
  let min: string | null = null;
  let max: string | null = null;
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const raw = (row as any).date ?? (row as any).Date;
    const norm = normalizeDate(raw);
    if (!norm) continue;
    if (!min || norm < min) min = norm;
    if (!max || norm > max) max = norm;
  }
  if (!min || !max) return null;
  return { minDate: min, maxDate: max };
}

function diffDays(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  const ms = Math.abs(da.getTime() - db.getTime());
  return ms / (1000 * 60 * 60 * 24);
}

export function runDateRangeAgent(input: DateRangeAgentInput): DateRangeAgentOutput {
  const ranges: DateRangeAgentOutput['ranges'] = {};
  const issues: string[] = [];

  const campaign = extractRange(input.campaignRows);
  const advertised = extractRange(input.advertisedProductRows);
  const targeting = extractRange(input.targetingRows);
  const searchTerm = extractRange(input.searchTermRows);

  if (campaign) ranges.campaign = campaign;
  if (advertised) ranges.advertisedProduct = advertised;
  if (targeting) ranges.targeting = targeting;
  if (searchTerm) ranges.searchTerm = searchTerm;

  const all = [campaign, advertised, targeting, searchTerm].filter((r): r is DateRangeInfo => !!r);
  if (all.length > 1) {
    const globalMin = all.reduce((min, r) => (!min || (r.minDate && r.minDate < min) ? r.minDate : min), all[0].minDate)!;
    const globalMax = all.reduce((max, r) => (!max || (r.maxDate && r.maxDate > max) ? r.maxDate : max), all[0].maxDate)!;
    for (const [label, range] of [
      ['Campaign', campaign],
      ['Advertised Product', advertised],
      ['Targeting', targeting],
      ['Search Term', searchTerm],
    ] as const) {
      if (!range) continue;
      const minDelta = diffDays(globalMin, range.minDate!);
      const maxDelta = diffDays(globalMax, range.maxDate!);
      if (minDelta > 1 || maxDelta > 1) {
        issues.push(`Date range mismatch across reports: ${label} range ${range.minDate}–${range.maxDate} vs global ${globalMin}–${globalMax}.`);
      }
    }
  }

  return { ranges, issues };
}

