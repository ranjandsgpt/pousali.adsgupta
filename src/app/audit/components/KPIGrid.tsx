'use client';

import { useAuditStore } from '../context/AuditStoreContext';
import { formatCurrency, formatPercent } from '../utils/formatNumber';

export default function KPIGrid() {
  const { state } = useAuditStore();
  const { store, globalTACOS, blendedROAS } = state;
  const symbol = store.currency ? formatCurrency(0, store.currency).replace('0.00', '') : '$';

  const cards = [
    {
      id: 'sales',
      label: 'Total Store Sales',
      value: store.totalStoreSales > 0 ? formatCurrency(store.totalStoreSales, store.currency) : '—',
      sub: `Auto-detected currency (${symbol})`,
    },
    {
      id: 'spend',
      label: 'Total Ad Spend',
      value: store.totalAdSpend > 0 ? formatCurrency(store.totalAdSpend, store.currency) : '—',
      sub: '',
    },
    {
      id: 'tacos',
      label: 'Global Store TACOS',
      value: globalTACOS > 0 ? formatPercent(globalTACOS) : '—',
      sub: '',
    },
    {
      id: 'roas',
      label: 'Blended ROAS',
      value: blendedROAS > 0 ? blendedROAS.toFixed(2) + '×' : '—',
      sub: '',
    },
  ];

  return (
    <section
      aria-labelledby="kpi-heading"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-6"
    >
      <h2 id="kpi-heading" className="sr-only">
        Key performance indicators
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
              {card.label}
            </p>
            <p className="text-2xl font-bold text-[var(--color-text)] tabular-nums">
              {card.value}
            </p>
            {card.sub && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{card.sub}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
