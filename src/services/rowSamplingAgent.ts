export interface RowSamplingInput {
  rows: any[];
  sampleSize?: number;
}

export interface RowSamplingRecord {
  index: number;
  spend?: unknown;
  sales7d?: unknown;
  clicks?: unknown;
  impressions?: unknown;
  orders?: unknown;
}

export interface RowSamplingOutput {
  samples: RowSamplingRecord[];
}

export function runRowSamplingAgent(input: RowSamplingInput): RowSamplingOutput {
  const size = input.sampleSize ?? 5;
  const samples: RowSamplingRecord[] = [];
  const rows = input.rows ?? [];
  const n = Math.min(size, rows.length);

  for (let i = 0; i < n; i++) {
    const row = rows[i];
    if (!row || typeof row !== 'object') continue;
    const r = row as any;
    samples.push({
      index: i,
      spend: r.spend ?? r.Spend ?? r.Cost,
      sales7d: r.sales7d ?? r['7 Day Total Sales'],
      clicks: r.clicks ?? r.Clicks,
      impressions: r.impressions ?? r.Impressions,
      orders:
        r.orders ??
        r.Orders ??
        r['7 Day Total Orders'] ??
        r['Total Order Items'] ??
        r['Units Sold'] ??
        r.units ??
        r.Units,
    });
  }

  return { samples };
}

