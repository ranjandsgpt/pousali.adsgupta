'use client';

import { useAuditStore } from '../context/AuditStoreContext';

/** Section 25: Tag cloud of all metrics detected in uploaded reports (data schema preview). */
const DISPLAY_NAMES: Record<string, string> = {
  spend: 'spend',
  sales: 'sales',
  clicks: 'clicks',
  impressions: 'impressions',
  orders: 'orders',
  units: 'units',
  searchTerm: 'searchTerm',
  campaignName: 'campaignName',
  adGroup: 'adGroup',
  matchType: 'matchType',
  asin: 'asin',
  sku: 'sku',
  sessions: 'sessions',
  orderedProductSales: 'orderedProductSales',
  date: 'date',
  budget: 'budget',
  pageViews: 'pageViews',
  other: 'other',
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
        Detected Metrics
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
