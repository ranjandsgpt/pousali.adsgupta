'use client';

import { useMemo } from 'react';
import { useAuditStore } from '../context/AuditStoreContext';
import { formatCurrency, formatPercent } from '../utils/formatNumber';
import { executeMetricEngineForStore } from '@/services/metricExecutionEngine';

/** Section 24: Full dashboard replication – 11 KPI cards with value, trend, color. */
export default function KPIGrid() {
  const { state } = useAuditStore();
  const { store } = state;
  const symbol = store.currency ? formatCurrency(0, store.currency).replace('0.00', '') : '$';
  const overrides = state.learnedOverrides?.overrides;

  const derived = useMemo(() => {
    const agg = store.aggregatedMetrics;
    const totalAdClicks = agg
      ? agg.adClicks
      : (store.totalClicks > 0 ? store.totalClicks : Object.values(store.keywordMetrics).reduce((s, m) => s + m.clicks, 0));
    const totalSessions = agg
      ? agg.sessions
      : (store.totalSessions > 0 ? store.totalSessions : Object.values(store.asinMetrics).reduce((s, m) => s + m.sessions, 0));
    const totalOrders = agg ? agg.adOrders : (store.totalOrders ?? 0);
    const buyBoxFromStore = store.buyBoxPercent;
    const buyBoxValues = Object.values(store.asinMetrics)
      .map((m) => m.buyBoxPercent)
      .filter((v): v is number => typeof v === 'number' && v >= 0);
    const buyBoxPct =
      agg?.buyBoxPct != null && agg.buyBoxPct > 0
        ? agg.buyBoxPct * 100
        : (buyBoxFromStore != null && buyBoxFromStore > 0
            ? buyBoxFromStore
            : buyBoxValues.length > 0
              ? buyBoxValues.reduce((a, b) => a + b, 0) / buyBoxValues.length
              : null);
    const storeAcos =
      agg?.acos != null
        ? agg.acos * 100
        : (store.totalAdSales > 0 ? (store.totalAdSpend / store.totalAdSales) * 100 : null);
    const m = store.storeMetrics;
    const conversionRate =
      agg?.adCvr != null
        ? agg.adCvr * 100
        : (m.conversionRate != null && m.conversionRate > 0
            ? m.conversionRate
            : totalSessions > 0 && totalOrders > 0
              ? (totalOrders / totalSessions) * 100
              : null);
    const canonical = !agg ? executeMetricEngineForStore(store, overrides) : null;
    return {
      totalAdClicks,
      totalSessions,
      totalOrders,
      buyBoxPct,
      storeAcos,
      roas: agg?.roas ?? canonical?.roas ?? 0,
      tacosPct: agg?.tacos != null ? agg.tacos * 100 : (canonical ? canonical.tacos * 100 : 0),
      conversionRate,
      aov: totalOrders > 0 ? store.totalStoreSales / totalOrders : null,
      adSalesPercent: m.adSalesPercent,
      organicVsPaidRatio: m.organicVsPaidRatio,
      revenueConcentrationTop10: m.revenueConcentrationTop10Asin,
      totalPageViews: store.totalPageViews,
    };
  }, [store, overrides]);

  const trendLabel = '—';
  const trendUp = true;

  const cards: Array<{
    id: string;
    label: string;
    value: string;
    trend: string;
    status: 'green' | 'red' | 'orange' | 'blue';
  }> = [
    {
      id: 'sales',
      label: 'Total Store Sales',
      value:
        store.totalStoreSales > 0
          ? formatCurrency(store.totalStoreSales, store.currency)
          : '—',
      trend: trendLabel,
      status: store.totalStoreSales > 0 ? 'green' : 'blue',
    },
    {
      id: 'spend',
      label: 'Total Ad Spend',
      value:
        store.totalAdSpend > 0 ? formatCurrency(store.totalAdSpend, store.currency) : '—',
      trend: trendLabel,
      status: store.totalAdSpend > 0 ? 'red' : 'blue',
    },
    {
      id: 'clicks',
      label: 'Total Ad Clicks',
      value: derived.totalAdClicks > 0 ? derived.totalAdClicks.toLocaleString() : '—',
      trend: trendLabel,
      status: derived.totalAdClicks > 0 ? 'blue' : 'blue',
    },
    {
      id: 'orders',
      label: 'Total Orders',
      value:
        derived.totalOrders > 0 ? derived.totalOrders.toLocaleString() : '—',
      trend: trendLabel,
      status: derived.totalOrders > 0 ? 'green' : 'blue',
    },
    {
      id: 'sessions',
      label: 'Sessions',
      value: derived.totalSessions > 0 ? derived.totalSessions.toLocaleString() : '—',
      trend: trendLabel,
      status: derived.totalSessions > 0 ? 'blue' : 'blue',
    },
    {
      id: 'cvr',
      label: 'Conversion Rate',
      value:
        derived.conversionRate != null
          ? formatPercent(derived.conversionRate)
          : '—',
      trend: trendLabel,
      status:
        derived.conversionRate != null
          ? derived.conversionRate >= 10
            ? 'green'
            : derived.conversionRate >= 4
              ? 'orange'
              : 'red'
          : 'blue',
    },
    {
      id: 'aov',
      label: 'AOV',
      value:
        derived.aov != null ? formatCurrency(derived.aov, store.currency) : '—',
      trend: trendLabel,
      status: derived.aov != null && derived.aov > 0 ? 'green' : 'blue',
    },
    {
      id: 'buybox',
      label: 'Buy Box %',
      value:
        derived.buyBoxPct != null
          ? Math.round(derived.buyBoxPct).toString() + '%'
          : '—',
      trend: trendLabel,
      status:
        derived.buyBoxPct != null
          ? derived.buyBoxPct >= 90
            ? 'green'
            : derived.buyBoxPct >= 70
              ? 'orange'
              : 'red'
          : 'blue',
    },
    {
      id: 'acos',
      label: 'ACOS',
      value:
        derived.storeAcos != null ? formatPercent(derived.storeAcos) : '—',
      trend: trendLabel,
      status:
        derived.storeAcos != null
          ? derived.storeAcos <= 15
            ? 'green'
            : derived.storeAcos <= 30
              ? 'orange'
              : 'red'
          : 'blue',
    },
    {
      id: 'roas',
      label: 'ROAS',
      value: derived.roas > 0 ? derived.roas.toFixed(2) + '×' : '—',
      trend: trendLabel,
      status:
        derived.roas >= 5 ? 'green' : derived.roas >= 3 ? 'orange' : derived.roas > 0 ? 'red' : 'blue',
    },
    {
      id: 'tacos',
      label: 'TACOS',
      value: derived.tacosPct > 0 ? formatPercent(derived.tacosPct) : '—',
      trend: trendLabel,
      status:
        derived.tacosPct > 0
          ? derived.tacosPct <= 10
            ? 'green'
            : derived.tacosPct <= 20
              ? 'orange'
              : 'red'
          : 'blue',
    },
    {
      id: 'ad-sales',
      label: 'Ad Sales',
      value: store.totalAdSales > 0 ? formatCurrency(store.totalAdSales, store.currency) : '—',
      trend: trendLabel,
      status: store.totalAdSales > 0 ? 'green' : 'blue',
    },
    {
      id: 'organic-sales',
      label: 'Organic Sales',
      value: store.storeMetrics.organicSales > 0 ? formatCurrency(store.storeMetrics.organicSales, store.currency) : '—',
      trend: trendLabel,
      status: store.storeMetrics.organicSales > 0 ? 'green' : 'blue',
    },
    {
      id: 'total-sales',
      label: 'Total Sales',
      value: store.totalStoreSales > 0 ? formatCurrency(store.totalStoreSales, store.currency) : '—',
      trend: trendLabel,
      status: store.totalStoreSales > 0 ? 'green' : 'blue',
    },
    {
      id: 'ad-sales-pct',
      label: 'Ad Sales % of Total',
      value: derived.adSalesPercent != null && derived.adSalesPercent > 0 ? formatPercent(derived.adSalesPercent) : '—',
      trend: trendLabel,
      status: derived.adSalesPercent != null ? 'blue' : 'blue',
    },
    {
      id: 'organic-vs-paid',
      label: 'Organic vs Paid Ratio',
      value: derived.organicVsPaidRatio != null && derived.organicVsPaidRatio > 0 ? derived.organicVsPaidRatio.toFixed(2) + '×' : '—',
      trend: trendLabel,
      status: derived.organicVsPaidRatio != null ? 'blue' : 'blue',
    },
    {
      id: 'revenue-concentration',
      label: 'Revenue Concentration (Top 10 ASIN)',
      value: derived.revenueConcentrationTop10 != null && derived.revenueConcentrationTop10 > 0 ? formatPercent(derived.revenueConcentrationTop10 * 100) : '—',
      trend: trendLabel,
      status: derived.revenueConcentrationTop10 != null ? 'blue' : 'blue',
    },
    {
      id: 'page-views',
      label: 'Page Views',
      value: derived.totalPageViews != null && derived.totalPageViews > 0 ? derived.totalPageViews.toLocaleString() : '—',
      trend: trendLabel,
      status: derived.totalPageViews != null && derived.totalPageViews > 0 ? 'blue' : 'blue',
    },
  ];

  const statusClass = {
    green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    orange: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    blue: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  };

  return (
    <section
      aria-labelledby="kpi-heading"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-6"
    >
      <h2 id="kpi-heading" className="sr-only">
        Key performance indicators
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`rounded-xl border p-4 ${statusClass[card.status]}`}
          >
            <p className="text-xs font-medium uppercase tracking-wider opacity-90 mb-1">
              {card.label}
            </p>
            <p className="text-xl font-bold tabular-nums">{card.value}</p>
            <p className="text-xs mt-1 opacity-75">
              {card.trend !== '—' ? (trendUp ? '↑ ' : '↓ ') : ''}
              {card.trend}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
