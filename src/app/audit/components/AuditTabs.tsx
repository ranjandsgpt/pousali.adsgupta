'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Heart,
  Target,
  Search,
  FileSearch,
  Ban,
  Wallet,
  TrendingUp,
  Package,
  PieChart,
  PackageCheck,
  Radio,
  GitBranch,
  Trash2,
  Sparkles,
  LineChart,
  Brain,
  Bot,
  BarChart3,
} from 'lucide-react';
import { TabContent } from '../tabs/TabContent';
import type { TabId } from '../tabs/useTabData';

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'account-health', label: 'Account Health', icon: Heart },
  { id: 'campaign-intelligence', label: 'Campaign Intelligence', icon: Target },
  { id: 'keyword-intelligence', label: 'Keyword Intelligence', icon: Search },
  { id: 'search-term-intelligence', label: 'Search Term Intelligence', icon: FileSearch },
  { id: 'negative-keyword-engine', label: 'Negative Keyword Engine', icon: Ban },
  { id: 'budget-optimization', label: 'Budget Optimization', icon: Wallet },
  { id: 'bid-optimization', label: 'Bid Optimization', icon: TrendingUp },
  { id: 'asin-performance', label: 'ASIN Performance', icon: Package },
  { id: 'profitability-analysis', label: 'Profitability Analysis', icon: PieChart },
  { id: 'inventory-intelligence', label: 'Inventory Intelligence', icon: PackageCheck },
  { id: 'market-signals', label: 'Market Signals', icon: Radio },
  { id: 'structural-audit', label: 'Structural Audit', icon: GitBranch },
  { id: 'waste-detection', label: 'Waste Detection', icon: Trash2 },
  { id: 'growth-opportunities', label: 'Growth Opportunities', icon: Sparkles },
  { id: 'predictive-forecasting', label: 'Predictive Forecasting', icon: LineChart },
  { id: 'learning-intelligence', label: 'Learning Intelligence', icon: Brain },
  { id: 'ai-strategy-engine', label: 'AI Strategy Engine', icon: Bot },
  { id: 'charts-lab', label: 'Charts Lab', icon: BarChart3 },
];

export default function AuditTabs() {
  const [active, setActive] = useState<TabId>('overview');

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
            aria-selected={active === id}
            aria-controls={`panel-${id}`}
            id={`tab-${id}`}
            onClick={() => setActive(id)}
            className={`
              flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap rounded-lg
              border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500
              ${
                active === id
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
            hidden={active !== id}
            className={active !== id ? 'hidden' : ''}
          >
            {active === id && <TabContent tabId={id} />}
          </div>
        ))}
      </div>
    </section>
  );
}
