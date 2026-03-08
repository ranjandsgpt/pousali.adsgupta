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

/** Tab icons (accent kept for potential future use). */
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

export default function AuditTabs({ activeTab, onTabChange }: AuditTabsProps) {
  return (
    <section aria-label="Audit results tabs">
      <div className="audit-tabs-container">
        <div role="tablist" className="tab-list">
          {TABS.map(({ id, label }) => {
            const { icon: Icon } = TAB_STYLES[id];
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                aria-controls={`panel-${id}`}
                id={`tab-${id}`}
                onClick={() => onTabChange(id)}
                className={`tab-button focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] focus-visible:ring-[rgba(140,160,255,0.6)] ${activeTab === id ? 'active' : ''}`}
              >
                <Icon size={14} aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="tab-content-container p-6 min-h-[400px] overflow-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
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
