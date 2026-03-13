'use client';

import { useEffect, useState } from 'react';
import { ConfigStore } from '@/lib/configStore';
import { BehaviorStore, type BehaviorEvent } from '@/lib/behaviorStore';

const GATE_KEY = 'audit_system_unlocked';

export default function AuditSystemPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [eventCount, setEventCount] = useState<number>(0);
  const [recentEvents, setRecentEvents] = useState<BehaviorEvent[]>([]);
  const requiredPassword = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_AUDIT_SYSTEM_PASSWORD : undefined;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ok = sessionStorage.getItem(GATE_KEY) === '1' || !requiredPassword;
    setUnlocked(ok);
  }, [requiredPassword]);

  useEffect(() => {
    if (!unlocked) return;
    BehaviorStore.count().then(setEventCount).catch(() => setEventCount(0));
    BehaviorStore.getRecent(50).then(setRecentEvents).catch(() => setRecentEvents([]));
  }, [unlocked]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!requiredPassword) {
      setUnlocked(true);
      return;
    }
    if (password === requiredPassword) {
      sessionStorage.setItem(GATE_KEY, '1');
      setUnlocked(true);
    } else {
      setError('Incorrect password');
    }
  };

  const handleResetConfig = () => {
    ConfigStore.reset();
    window.location.reload();
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] p-8 flex items-center justify-center">
        <div className="max-w-sm w-full rounded-xl border border-white/10 bg-[var(--color-surface)] p-6">
          <h1 className="text-lg font-bold text-[var(--color-text)] mb-2">Audit System</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            {requiredPassword ? 'Enter password to continue.' : 'No password set. Access allowed.'}
          </p>
          {requiredPassword ? (
            <form onSubmit={handleUnlock}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] mb-3"
              />
              {error && <p className="text-sm text-red-400 mb-2">{error}</p>}
              <button type="submit" className="w-full py-2 rounded-lg bg-blue-500/20 text-blue-400 font-medium">
                Unlock
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setUnlocked(true)}
              className="w-full py-2 rounded-lg bg-blue-500/20 text-blue-400 font-medium"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    );
  }

  const configKeys: (keyof typeof ConfigStore.defaults)[] = Object.keys(
    ConfigStore.defaults
  ) as (keyof typeof ConfigStore.defaults)[];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Audit System Dashboard</h1>

        <section className="rounded-xl border border-white/10 bg-[var(--color-surface)] p-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">ConfigStore</h2>
          <ul className="space-y-2 text-sm">
            {configKeys.map((k) => (
              <li key={String(k)} className="flex justify-between gap-4">
                <span className="text-[var(--color-text-muted)]">{String(k)}</span>
                <span className="text-[var(--color-text)] font-mono truncate max-w-[60%]">
                  {JSON.stringify(ConfigStore.get(k))}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={handleResetConfig}
            className="mt-3 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium"
          >
            Reset to defaults
          </button>
        </section>

        <section className="rounded-xl border border-white/10 bg-[var(--color-surface)] p-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">BehaviorStore</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-2">Total events: {eventCount}</p>
          <div className="max-h-64 overflow-auto rounded-lg bg-black/20 p-2">
            {recentEvents.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No events yet.</p>
            ) : (
              <ul className="space-y-1 text-xs font-mono">
                {recentEvents.map((ev, i) => (
                  <li key={ev.id ?? i} className="text-[var(--color-text)]">
                    {new Date(ev.timestamp).toISOString()} | {ev.event}
                    {ev.context ? ` | ${ev.context}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
