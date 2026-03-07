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
  Brain,
  BarChart3,
} from 'lucide-react';
import { TabContent } from '../tabs/TabContent';
import type { TabId } from '../tabs/useTabData';

/** Color-coded tabs with icons (Phase 4). */
const TAB_STYLES: Record<TabId, { accent: string; icon: LucideIcon }> = {
  overview: { accent: 'cyan', icon: LayoutDashboard },
  'keywords-search-terms': { accent: 'purple', icon: Search },
  'campaigns-budget': { accent: 'orange', icon: Target },
  'asins-products': { accent: 'emerald', icon: Package },
  'waste-bleed': { accent: 'red', icon: Trash2 },
  'profitability-inventory': { accent: 'amber', icon: PieChart },
  'gemini-insights': { accent: 'indigo', icon: Brain },
  'insights-reports': { accent: 'teal', icon: BarChart3 },
};

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'keywords-search-terms', label: 'Keywords & Search Terms' },
  { id: 'campaigns-budget', label: 'Campaigns & Budget' },
  { id: 'asins-products', label: 'ASINs & Products' },
  { id: 'waste-bleed', label: 'Waste & Bleed' },
  { id: 'profitability-inventory', label: 'Profitability & Inventory' },
  { id: 'gemini-insights', label: 'Gemini Insights' },
  { id: 'insights-reports', label: 'More Diagnosis' },
];

export interface AuditTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

function tabButtonClass(active: boolean, accent: string): string {
  const base = 'flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap rounded-lg border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]';
  if (active) {
    const colors: Record<string, string> = {
      cyan: 'border-cyan-500 bg-cyan-500/15 text-cyan-400 shadow-sm',
      purple: 'border-purple-500 bg-purple-500/15 text-purple-400 shadow-sm',
      orange: 'border-orange-500 bg-orange-500/15 text-orange-400 shadow-sm',
      emerald: 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-sm',
      red: 'border-red-500 bg-red-500/15 text-red-400 shadow-sm',
      amber: 'border-amber-500 bg-amber-500/15 text-amber-400 shadow-sm',
      indigo: 'border-indigo-500 bg-indigo-500/15 text-indigo-400 shadow-sm',
      teal: 'border-teal-500 bg-teal-500/15 text-teal-400 shadow-sm',
    };
    return `${base} ${colors[accent] ?? colors.cyan} border-b-2 border-b-current`;
  }
  return `${base} border-white/10 bg-white/5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/10`;
}

export default function AuditTabs({ activeTab, onTabChange }: AuditTabsProps) {
  return (
    <section
      aria-label="Audit results tabs"
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] overflow-hidden"
    >
      <div
        role="tablist"
        className="flex border-b border-[var(--color-border)] overflow-x-auto gap-1 p-2 scrollbar-thin"
      >
        {TABS.map(({ id, label }) => {
          const { accent, icon: Icon } = TAB_STYLES[id];
          return (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              aria-controls={`panel-${id}`}
              id={`tab-${id}`}
              onClick={() => onTabChange(id)}
              className={tabButtonClass(activeTab === id, accent)}
            >
              <Icon size={14} aria-hidden />
              {label}
            </button>
          );
        })}
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
