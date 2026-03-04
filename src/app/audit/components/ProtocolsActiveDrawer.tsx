'use client';

import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';

const AGENTS = [
  'FileUploadAgent',
  'HeaderDiscoveryAgent',
  'CurrencyMappingAgent',
  'SKUtoASINAgent',
  'DuplicateDetectionAgent',
  'NumericSanitizerAgent',
  'AggregationAgent',
  'MathVerificationAgent',
  'ChartBuilderAgent',
  'ExportAgent',
] as const;

const STAGGER_MS = 180;

interface ProtocolsActiveDrawerProps {
  isRunning: boolean;
  /** When false, hide the top-right indicator (e.g. on upload step). */
  visible?: boolean;
}

export default function ProtocolsActiveDrawer({ isRunning, visible = true }: ProtocolsActiveDrawerProps) {
  const [open, setOpen] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      setCompletedCount(AGENTS.length);
      return;
    }
    setCompletedCount(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    AGENTS.forEach((_, i) => {
      timers.push(
        setTimeout(() => setCompletedCount((c) => Math.min(c + 1, AGENTS.length)), (i + 1) * STAGGER_MS)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [isRunning]);

  const allComplete = completedCount >= AGENTS.length;

  if (!visible) return null;

  return (
    <>
      {/* Fixed top-right so it's always visible and never overlaps page content */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-20 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 bg-[var(--color-surface-elevated)]/95 backdrop-blur-md text-sm text-[var(--color-text)] hover:bg-white/10 shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        aria-label="View active protocols"
      >
        <span
          className={`h-2 w-2 rounded-full shrink-0 ${isRunning ? 'bg-cyan-500 animate-pulse' : 'bg-emerald-500'}`}
          aria-hidden
        />
        <span className="font-medium whitespace-nowrap">
          {AGENTS.length} Protocols Active
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <aside
            role="dialog"
            aria-label="Active protocols"
            className="fixed top-0 right-0 z-[100] h-full w-full max-w-sm border-l border-white/10 bg-[var(--color-surface-elevated)] shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">Active Protocols</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-white/10 hover:text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${isRunning ? 'bg-cyan-500 animate-pulse' : 'bg-emerald-500'}`}
              />
              <span className="text-sm text-[var(--color-text-muted)]">
                {isRunning ? 'Processing…' : allComplete ? 'All complete' : 'Running'}
              </span>
            </div>
            <ul className="flex-1 overflow-y-auto p-4 space-y-2" role="list">
              {AGENTS.map((name, i) => {
                const completed = i < completedCount;
                return (
                  <li
                    key={name}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-mono transition-colors ${
                      completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-[var(--color-text-muted)]'
                    }`}
                  >
                    {completed ? (
                      <Check size={16} className="shrink-0 text-emerald-500" aria-hidden />
                    ) : (
                      <span className="w-4 h-4 shrink-0 rounded-full border-2 border-current opacity-50" aria-hidden />
                    )}
                    <span className="flex-1">[{completed ? '✓' : ' '}] {name}</span>
                    <span className="text-xs">
                      {completed ? 'Completed' : isRunning ? 'Running' : 'Pending'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </aside>
        </>
      )}
    </>
  );
}
