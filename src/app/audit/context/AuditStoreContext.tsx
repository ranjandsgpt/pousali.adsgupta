'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import type { MemoryStore } from '../utils/reportParser';
import { createEmptyStore } from '../utils/reportParser';
import {
  executeMetricEngineForStore,
  buildMetricInputFromStore,
} from '@/services/metricExecutionEngine';
import type { OverrideState } from '@/services/overrideEngine';
import { runSelfVerificationAgent, selfVerificationInputFromMetricInput } from '@/services/selfVerificationAgent';
import type { ReconciliationOutput } from '@/services/metricReconciliationAgent';

export interface LearnedOverride {
  accountId?: string;
  overrides: OverrideState;
  reasoning: string;
}

export interface AuditState {
  store: MemoryStore;
  /** Derived for UI */
  globalTACOS: number;
  blendedROAS: number;
  /** Self-healing: overrides learned from Dislike feedback; applied on next metric run */
  learnedOverrides: LearnedOverride | null;
  /** Metric reconciliation result (run before metrics on upload/analysis) */
  reconciliation: ReconciliationOutput | null;
}

const defaultState: AuditState = {
  store: createEmptyStore(),
  globalTACOS: 0,
  blendedROAS: 0,
  learnedOverrides: null,
  reconciliation: null,
};

const AuditStoreContext = createContext<{
  state: AuditState;
  setStore: (store: MemoryStore, appliedOverrides?: LearnedOverride | null) => void;
  setLearnedOverrides: (learned: LearnedOverride | null) => void;
  reset: () => void;
}>({
  state: defaultState,
  setStore: () => {},
  setLearnedOverrides: () => {},
  reset: () => {},
});

export function useAuditStore() {
  const ctx = useContext(AuditStoreContext);
  if (!ctx) throw new Error('useAuditStore must be used within AuditStoreProvider');
  return ctx;
}

export function AuditStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuditState>(defaultState);

  const setStore = useCallback((store: MemoryStore, appliedOverrides?: LearnedOverride | null) => {
    const overrides = appliedOverrides?.overrides ?? state.learnedOverrides?.overrides;
    const metricInput = buildMetricInputFromStore(store);
    const verification = runSelfVerificationAgent(selfVerificationInputFromMetricInput(metricInput));
    const reconciliation = verification.reconciliation;
    if (verification.issues.length > 0) {
      verification.issues.forEach((issue) => {
        // eslint-disable-next-line no-console
        console.warn('[SelfVerification]', issue);
      });
    }
    if (verification.status === 'error') {
      // eslint-disable-next-line no-console
      console.error('[SelfVerification] status: error. Review issues above.');
    }
    const canonical = executeMetricEngineForStore(store, overrides);
    setState((prev) => ({
      ...prev,
      store,
      globalTACOS: canonical.tacos * 100,
      blendedROAS: canonical.roas,
      reconciliation,
      ...(appliedOverrides != null ? { learnedOverrides: appliedOverrides } : {}),
    }));
  }, [state.learnedOverrides?.overrides]);

  const setLearnedOverrides = useCallback((learned: LearnedOverride | null) => {
    setState((prev) => ({ ...prev, learnedOverrides: learned }));
  }, []);

  const reset = useCallback(() => {
    setState({
      store: createEmptyStore(),
      globalTACOS: 0,
      blendedROAS: 0,
      learnedOverrides: null,
      reconciliation: null,
    });
  }, []);

  return (
    <AuditStoreContext.Provider value={{ state, setStore, setLearnedOverrides, reset }}>
      {children}
    </AuditStoreContext.Provider>
  );
}
