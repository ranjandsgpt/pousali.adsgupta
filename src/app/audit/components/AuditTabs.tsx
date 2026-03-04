'use client';

import { useState } from 'react';
import { BarChart3, Search, AlertTriangle, Package } from 'lucide-react';
import SearchTermTable from '../tables/SearchTermTable';
import BleederTable from '../tables/BleederTable';
import AsinProfitabilityTable from '../tables/AsinProfitabilityTable';
import AuditCharts from '../charts/AuditCharts';

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
            {active === 'charts' && <AuditCharts />}
            {active === 'search-terms' && <SearchTermTable />}
            {active === 'bleeders' && <BleederTable />}
            {active === 'asin' && <AsinProfitabilityTable />}
          </div>
        ))}
      </div>
    </section>
  );
}
