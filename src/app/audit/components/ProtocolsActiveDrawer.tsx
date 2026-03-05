'use client';

import { useEffect, useState, useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { useAuditStore } from '../context/AuditStoreContext';

const AUDIT_PROTOCOLS = [
  'keyword_bleed_detection',
  'high_acos_campaigns',
  'negative_keyword_opportunities',
  'hidden_profitable_keywords',
  'budget_capped_campaigns',
  'low_conversion_keywords',
  'asin_profitability_check',
  'organic_vs_paid_halo',
  'match_type_efficiency',
  'keyword_scaling_candidates',
] as const;

type AuditProtocol = (typeof AUDIT_PROTOCOLS)[number];

const STAGGER_MS = 180;

interface ProtocolsActiveDrawerProps {
  isRunning: boolean;
  /** When false, hide the top-right indicator (e.g. on upload step). */
  visible?: boolean;
}

export default function ProtocolsActiveDrawer({ isRunning, visible = true }: ProtocolsActiveDrawerProps) {
  const { state } = useAuditStore();
  const [open, setOpen] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const protocolStatus = useMemo<Record<AuditProtocol, boolean>>(() => {
    const store = state.store;
    const kws = Object.values(store.keywordMetrics);
    const campaigns = Object.values(store.campaignMetrics);
    const asins = Object.values(store.asinMetrics);
    const status: Record<AuditProtocol, boolean> = {
      keyword_bleed_detection: kws.length > 0,
      high_acos_campaigns: campaigns.length > 0,
      negative_keyword_opportunities: kws.length > 0,
      hidden_profitable_keywords: kws.length > 0,
      budget_capped_campaigns: campaigns.some((c) => c.budget > 0),
      low_conversion_keywords: store.totalSessions > 0 || kws.length > 0,
      asin_profitability_check: asins.length > 0,
      organic_vs_paid_halo: store.storeMetrics.organicSales !== 0 || store.totalAdSales > 0,
      match_type_efficiency: kws.some((k) => !!k.matchType),
      keyword_scaling_candidates: kws.length > 0,
    };
    return status;
  }, [state.store]);

  const activeProtocols = useMemo(
    () => Object.values(protocolStatus).filter(Boolean).length,
    [protocolStatus]
  );

  useEffect(() => {
    if (!isRunning) {
      setCompletedCount(AUDIT_PROTOCOLS.length);
      return;
    }
    setCompletedCount(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    AUDIT_PROTOCOLS.forEach((_, i) => {
      timers.push(
        setTimeout(
          () => setCompletedCount((c) => Math.min(c + 1, AUDIT_PROTOCOLS.length)),
          (i + 1) * STAGGER_MS
        )
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [isRunning]);

  const allComplete = completedCount >= AUDIT_PROTOCOLS.length;

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
          {activeProtocols}/{AUDIT_PROTOCOLS.length} Protocols Active
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
              {AUDIT_PROTOCOLS.map((name, i) => {
                const completed = protocolStatus[name];
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
                    <span className="flex-1">
                      [{completed ? '✓' : ' '}] {name.replace(/_/g, ' ')}
                    </span>
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
