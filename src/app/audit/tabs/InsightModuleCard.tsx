'use client';

import { useState } from 'react';
import type { InsightModule } from './types';
import { ChevronDown, ChevronRight } from 'lucide-react';

const severityStyles = {
  critical: 'border-red-500/40 bg-red-500/10',
  warning: 'border-amber-500/40 bg-amber-500/10',
  info: 'border-sky-500/30 bg-sky-500/5',
  opportunity: 'border-emerald-500/40 bg-emerald-500/10',
};

export function InsightModuleCard({
  module,
  onDeepDive,
  expanded,
  children,
}: {
  module: InsightModule;
  onDeepDive?: () => void;
  expanded?: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isOpen = expanded ?? open;
  const style = severityStyles[module.severity ?? 'info'];

  return (
    <div className={`rounded-xl border p-4 ${style}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-[var(--color-text)]">{module.title}</h4>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{module.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium tabular-nums">
              {module.count} {module.count === 1 ? 'item' : 'items'}
            </span>
            {module.impact && (
              <span className="text-xs font-medium text-[var(--color-text)]">{module.impact}</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!isOpen)}
          className="flex shrink-0 items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-white/10"
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Show Details
        </button>
      </div>
      {isOpen && children && <div className="mt-4 border-t border-white/10 pt-4">{children}</div>}
    </div>
  );
}
