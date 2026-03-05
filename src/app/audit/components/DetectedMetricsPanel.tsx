'use client';

import { useAuditStore } from '../context/AuditStoreContext';

/** Section 25: Tag cloud of all metrics detected in uploaded reports (data schema preview). */
const DISPLAY_NAMES: Record<string, string> = {
  spend: 'Spend',
  sales: 'Sales',
  clicks: 'Clicks',
  impressions: 'Impressions',
  orders: 'Orders',
  units: 'Units',
  searchTerm: 'Keyword',
  campaignName: 'Campaign',
  adGroup: 'Ad Group',
  matchType: 'Match Type',
  asin: 'ASIN',
  sku: 'SKU',
  sessions: 'Sessions',
  orderedProductSales: 'Ordered Product Sales',
  date: 'Date',
  budget: 'Daily Budget',
  pageViews: 'Page Views',
  acos: 'ACOS',
  roas: 'ROAS',
  tacos: 'TACOS',
  ctr: 'CTR',
  cvr: 'CVR',
  conversion: 'Conversion',
  buybox: 'Buy Box %',
  currency: 'Currency',
  profitMargin: 'Profit Margin',
  other: 'Other',
};

export default function DetectedMetricsPanel() {
  const { state } = useAuditStore();
  const columns = Array.from(state.store.uniqueColumns).filter((c) => c !== 'other');
  const tags = columns.length > 0 ? columns : ['impressions', 'clicks', 'orders', 'spend', 'sales', 'sessions', 'conversion', 'buybox', 'roas', 'acos', 'tacos', 'pageViews'];

  return (
    <section
      aria-labelledby="detected-metrics-heading"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-6"
    >
      <h2 id="detected-metrics-heading" className="text-sm font-semibold text-[var(--color-text)] mb-3">
        2. Detected metrics ({tags.length})
      </h2>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30"
          >
            {DISPLAY_NAMES[tag] ?? tag}
          </span>
        ))}
      </div>
    </section>
  );
}
