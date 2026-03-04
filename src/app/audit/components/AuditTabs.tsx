'use client';

import { useState } from 'react';
import { BarChart3, Search, AlertTriangle, Package } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'charts', label: 'Charts', icon: BarChart3 },
  { id: 'search-terms', label: 'Search Terms', icon: Search },
  { id: 'bleeders', label: 'Bleeders', icon: AlertTriangle },
  { id: 'asin', label: 'ASIN Performance', icon: Package },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AuditTabs() {
  const [active, setActive] = useState<TabId>('overview');

  return (
    <section
      aria-label="Audit results tabs"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] overflow-hidden"
    >
      <div
        role="tablist"
        className="flex border-b border-white/10 overflow-x-auto"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={active === id}
            aria-controls={`panel-${id}`}
            id={`tab-${id}`}
            onClick={() => setActive(id)}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
              border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-inset
              ${
                active === id
                  ? 'border-cyan-500 text-cyan-500'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }
            `}
          >
            <Icon size={18} aria-hidden />
            {label}
          </button>
        ))}
      </div>
      <div className="p-6 min-h-[320px]">
        {TABS.map(({ id }) => (
          <div
            key={id}
            id={`panel-${id}`}
            role="tabpanel"
            aria-labelledby={`tab-${id}`}
            hidden={active !== id}
            className={active !== id ? 'hidden' : ''}
          >
            {active === 'overview' && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
                <BarChart3 className="mx-auto mb-3 text-[var(--color-text-muted)]" size={40} />
                <p className="text-[var(--color-text)] font-medium">Overview</p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  Summary metrics and charts. Plug in dashboard content here.
                </p>
              </div>
            )}
            {active === 'charts' && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
                <BarChart3 className="mx-auto mb-3 text-[var(--color-text-muted)]" size={40} />
                <p className="text-[var(--color-text)] font-medium">Charts</p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  Recharts placeholders: TACOS over time, spend by campaign, etc.
                </p>
              </div>
            )}
            {active === 'search-terms' && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
                <Search className="mx-auto mb-3 text-[var(--color-text-muted)]" size={40} />
                <p className="text-[var(--color-text)] font-medium">Search Terms</p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  Table: search term, spend, sales, ACOS. Plug in table component.
                </p>
              </div>
            )}
            {active === 'bleeders' && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
                <AlertTriangle className="mx-auto mb-3 text-[var(--color-text-muted)]" size={40} />
                <p className="text-[var(--color-text)] font-medium">Bleeders</p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  Wasted spend table. Plug in bleeders table here.
                </p>
              </div>
            )}
            {active === 'asin' && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
                <Package className="mx-auto mb-3 text-[var(--color-text-muted)]" size={40} />
                <p className="text-[var(--color-text)] font-medium">ASIN Performance</p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  ASIN-level profitability table. Plug in ASIN table here.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
