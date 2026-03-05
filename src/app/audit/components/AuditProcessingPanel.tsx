'use client';

import { Check, X, Loader2 } from 'lucide-react';
import { usePipeline, PIPELINE_STAGES, PIPELINE_STAGE_LABELS } from '../context/PipelineContext';

export default function AuditProcessingPanel() {
  const { pipeline, isRunning } = usePipeline();

  return (
    <section
      aria-label="Audit processing"
      className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-4 sm:p-5"
    >
      <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
        Audit Processing
      </h2>
      <ul className="space-y-2" role="list">
        {PIPELINE_STAGES.map((stageId) => {
          const state = pipeline[stageId];
          const status = state?.status ?? 'idle';
          const label = PIPELINE_STAGE_LABELS[stageId];
          return (
            <li
              key={stageId}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                status === 'failed'
                  ? 'bg-red-500/10 text-red-400'
                  : status === 'running'
                    ? 'bg-cyan-500/10 text-cyan-300'
                    : status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-white/5 text-[var(--color-text-muted)]'
              }`}
            >
              {status === 'completed' && (
                <Check size={18} className="shrink-0 text-emerald-500" aria-hidden />
              )}
              {status === 'failed' && (
                <X size={18} className="shrink-0 text-red-500" aria-hidden />
              )}
              {status === 'running' && (
                <Loader2 size={18} className="shrink-0 text-cyan-400 animate-spin" aria-hidden />
              )}
              {status === 'idle' && (
                <span className="w-[18px] h-[18px] shrink-0 rounded-full border-2 border-current opacity-40" aria-hidden />
              )}
              <span className="flex-1 font-medium">
                {status === 'failed' && state?.error
                  ? `${label} — ${state.error}`
                  : label}
              </span>
              <span className="text-xs uppercase tracking-wider opacity-80">
                {status === 'idle' && 'Pending'}
                {status === 'running' && 'Running'}
                {status === 'completed' && 'Done'}
                {status === 'failed' && 'Failed'}
              </span>
            </li>
          );
        })}
      </ul>
      {isRunning && (
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Pipeline is running. Status updates in real time.
        </p>
      )}
    </section>
  );
}
