'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

/** Section 20: Agent Swarm Simulation – each agent shows [✓] Completed when done. */
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

interface AgentSwarmProps {
  isRunning: boolean;
}

const STAGGER_MS = 180;

export default function AgentSwarm({ isRunning }: AgentSwarmProps) {
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

  return (
    <section
      aria-labelledby="agent-swarm-heading"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] overflow-hidden"
    >
      <div className="px-4 sm:px-6 py-4 border-b border-white/10 flex items-center gap-3">
        <span
          className={`h-2 w-2 rounded-full ${isRunning ? 'bg-cyan-500 animate-pulse' : 'bg-emerald-500'}`}
          aria-hidden
        />
        <h2
          id="agent-swarm-heading"
          className="text-lg font-semibold text-[var(--color-text)]"
        >
          Agent Swarm Running
        </h2>
        {allComplete && (
          <span className="text-sm text-[var(--color-text-muted)]">All agents complete</span>
        )}
      </div>
      <div className="p-4 max-h-[320px] overflow-y-auto">
        <ul className="space-y-2" role="list">
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
                <span>[{completed ? '✓' : ' '}] {name}</span>
                {completed && <span className="text-xs ml-auto">Completed</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
