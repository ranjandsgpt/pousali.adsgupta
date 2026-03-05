'use client';

import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Search,
  Target,
  Package,
  Trash2,
  PieChart,
  Sparkles,
} from 'lucide-react';
import { TabContent } from '../tabs/TabContent';
import type { TabId } from '../tabs/useTabData';

/** Tabs: Overview, Keywords, Campaigns, ASINs, Waste & Bleed, Profitability, Insights & Reports. */
const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'keywords-search-terms', label: 'Keywords & Search Terms', icon: Search },
  { id: 'campaigns-budget', label: 'Campaigns & Budget', icon: Target },
  { id: 'asins-products', label: 'ASINs & Products', icon: Package },
  { id: 'waste-bleed', label: 'Waste & Bleed', icon: Trash2 },
  { id: 'profitability-inventory', label: 'Profitability & Inventory', icon: PieChart },
  { id: 'insights-reports', label: 'Insights & Reports', icon: Sparkles },
];

export interface AuditTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function AuditTabs({ activeTab, onTabChange }: AuditTabsProps) {
  return (
    <section
      aria-label="Audit results tabs"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] overflow-hidden"
    >
      <div
        role="tablist"
        className="flex border-b border-white/10 overflow-x-auto flex-wrap gap-1 p-2"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`panel-${id}`}
            id={`tab-${id}`}
            onClick={() => onTabChange(id)}
            className={`
              flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap rounded-lg
              border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500
              ${
                activeTab === id
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                  : 'border-white/10 bg-white/5 text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }
            `}
          >
            <Icon size={14} aria-hidden />
            {label}
          </button>
        ))}
      </div>
      <div className="p-6 min-h-[400px] overflow-auto">
        {TABS.map(({ id }) => (
          <div
            key={id}
            id={`panel-${id}`}
            role="tabpanel"
            aria-labelledby={`tab-${id}`}
            hidden={activeTab !== id}
            className={activeTab !== id ? 'hidden' : ''}
          >
            {activeTab === id && (
              <TabContent tabId={id} onNavigateToTab={onTabChange} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
