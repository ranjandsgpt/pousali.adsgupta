'use client';

const KPI_CARDS = [
  { id: 'sales', label: 'Total Store Sales', value: '—', sub: 'Auto-detected currency (€, £, $)' },
  { id: 'spend', label: 'Total Ad Spend', value: '—', sub: '' },
  { id: 'tacos', label: 'Global Store TACOS', value: '—', sub: '' },
  { id: 'roas', label: 'Blended ROAS', value: '—', sub: '' },
];

export default function KPIGrid() {
  return (
    <section
      aria-labelledby="kpi-heading"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-6"
    >
      <h2 id="kpi-heading" className="sr-only">
        Key performance indicators
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((card) => (
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
