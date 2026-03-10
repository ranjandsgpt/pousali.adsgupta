import { sanitizeNumeric } from '@/utils/sanitizeNumeric';

export interface OutlierDetectionInput {
  rows: any[];
}

export interface OutlierRecord {
  rowIndex: number;
  reason: string;
}

export interface OutlierDetectionOutput {
  anomalies: OutlierRecord[];
}

export function runOutlierDetectionAgent(input: OutlierDetectionInput): OutlierDetectionOutput {
  const anomalies: OutlierRecord[] = [];

  input.rows.forEach((row, index) => {
    if (!row || typeof row !== 'object') return;
    const r = row as any;
    const spend = sanitizeNumeric(r.spend ?? r.Spend ?? r.Cost);
    const clicks = sanitizeNumeric(r.clicks ?? r.Clicks);
    const impressions = sanitizeNumeric(r.impressions ?? r.Impressions);
    const orders = sanitizeNumeric(
      r.orders ?? r.Orders ?? r['Total Order Items'] ?? r['Units Sold'] ?? r.units ?? r.Units
    );

    const reasons: string[] = [];
    if (spend > 100000) reasons.push(`spend ${spend.toFixed(2)} > 100000`);

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    if (ctr > 100) reasons.push(`CTR ${ctr.toFixed(2)}% > 100%`);

    const cvr = clicks > 0 ? (orders / clicks) * 100 : 0;
    if (cvr > 100) reasons.push(`CVR ${cvr.toFixed(2)}% > 100%`);

    if (reasons.length > 0) {
      anomalies.push({ rowIndex: index, reason: reasons.join('; ') });
    }
  });

  return { anomalies };
}

