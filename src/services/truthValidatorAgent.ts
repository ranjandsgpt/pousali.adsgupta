import { AMAZON_SALES_ATTRIBUTION_COLUMN } from '@/config/amazonAttribution';
import { sanitizeNumeric } from '@/utils/sanitizeNumeric';

export interface TruthValidatorInput {
  engineTotals: {
    spend: number;
    sales: number;
  };
  advertisedProductRows?: any[];
  targetingRows?: any[];
  campaignRows?: any[];
}

export interface TruthValidatorOutput {
  status: 'ok' | 'warning' | 'error';
  differencePercent: number;
  engineTotals: {
    spend: number;
    sales: number;
  };
  rawTotals: {
    advertised: { spend: number; sales: number };
    targeting: { spend: number; sales: number };
    campaign: { spend: number; sales: number };
  };
  /** Set when differencePercent > 0.01 */
  issues: string[];
}

function getRowSpend(row: any): number {
  return sanitizeNumeric(row?.spend ?? row?.Spend ?? row?.Cost);
}

function getRowSales(row: any): number {
  const raw =
    row?.sales7d ??
    row?.[AMAZON_SALES_ATTRIBUTION_COLUMN] ??
    row?.['7 Day Total Sales'] ??
    row?.['Attributed Sales'] ??
    row?.sales ??
    row?.Sales;
  return sanitizeNumeric(raw);
}

function sumRows(rows: any[] | undefined): { spend: number; sales: number } {
  if (!rows || rows.length === 0) return { spend: 0, sales: 0 };
  let spend = 0;
  let sales = 0;
  for (const r of rows) {
    if (!r || typeof r !== 'object') continue;
    spend += getRowSpend(r);
    sales += getRowSales(r);
  }
  return { spend, sales };
}

export function runTruthValidatorAgent(input: TruthValidatorInput): TruthValidatorOutput {
  const { engineTotals } = input;
  const advertisedTotals = sumRows(input.advertisedProductRows);
  const targetingTotals = sumRows(input.targetingRows);
  const campaignTotals = sumRows(input.campaignRows);

  // Use the non-zero raw total that best matches the engine source; fall back to the largest.
  const candidates = [advertisedTotals, targetingTotals, campaignTotals];
  const baseline = candidates.find((c) => c.spend > 0) ?? { spend: 0, sales: 0 };

  let differencePercent = 0;
  if (baseline.spend > 0) {
    differencePercent = Math.abs(engineTotals.spend - baseline.spend) / baseline.spend;
  }

  const issues: string[] = [];
  let status: TruthValidatorOutput['status'] = 'ok';
  if (differencePercent > 0.01) {
    status = 'warning';
    issues.push('Engine totals diverge from raw row totals');
  }

  return {
    status,
    differencePercent,
    engineTotals,
    rawTotals: {
      advertised: advertisedTotals,
      targeting: targetingTotals,
      campaign: campaignTotals,
    },
    issues,
  };
}

