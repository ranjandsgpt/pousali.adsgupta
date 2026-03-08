'use client';

import { useState } from 'react';
import type { InsightModule } from './types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MetricFeedbackButtons } from '../components/MetricFeedbackButtons';

const severityStyles = {
  critical: 'border-red-500/60 bg-red-500/10',
  warning: 'border-amber-500/60 bg-amber-500/10',
  info: 'border-cyan-500/40 bg-cyan-500/10',
  opportunity: 'border-emerald-500/60 bg-emerald-500/10',
};

export function InsightModuleCard({
  module,
  onDeepDive,
  expanded,
  onNavigateToCampaigns,
  children,
}: {
  module: InsightModule;
  onDeepDive?: () => void;
  expanded?: boolean;
  /** When set, shows "View in Campaigns & Budget" and switches to that tab on click */
  onNavigateToCampaigns?: () => void;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isOpen = expanded ?? open;
  const style = severityStyles[module.severity ?? 'info'];

  return (
    <div className={`rounded-xl border p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-transform transition-shadow duration-150 ${style}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-[var(--color-text)]">{module.title}</h4>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{module.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium tabular-nums">
              {module.count} {module.count === 1 ? 'item' : 'items'}
            </span>
            {module.impactScore != null && (
              <span className="text-xs font-medium text-amber-400" title="Impact score">Impact: {module.impactScore.toFixed(1)}</span>
            )}
            {module.impact && (
              <span className="text-xs font-medium text-[var(--color-text)]">{module.impact}</span>
            )}
          </div>
          {module.evidence?.summary && (
            <p className="mt-1.5 text-xs text-[var(--color-text-muted)] border-l-2 border-cyan-500/50 pl-2">
              Evidence: {module.evidence.summary}
            </p>
          )}
          <div className="mt-2">
            <MetricFeedbackButtons
              metricId={`insight-${module.id}`}
              value={module.title}
              artifactType="insights"
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onNavigateToCampaigns && (
            <button
              type="button"
              onClick={onNavigateToCampaigns}
              className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20"
            >
              View in Campaigns & Budget →
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(!isOpen)}
            className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-white/10"
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Show Details
          </button>
        </div>
      </div>
      {isOpen && children && <div className="mt-4 border-t border-white/10 pt-4">{children}</div>}
    </div>
  );
}
