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
import { executeMetricEngineForStore } from '@/services/metricExecutionEngine';
import type { OverrideState } from '@/services/overrideEngine';

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
}

const defaultState: AuditState = {
  store: createEmptyStore(),
  globalTACOS: 0,
  blendedROAS: 0,
  learnedOverrides: null,
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
    const canonical = executeMetricEngineForStore(store, overrides);
    setState((prev) => ({
      ...prev,
      store,
      globalTACOS: canonical.tacos * 100,
      blendedROAS: canonical.roas,
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
    });
  }, []);

  return (
    <AuditStoreContext.Provider value={{ state, setStore, setLearnedOverrides, reset }}>
      {children}
    </AuditStoreContext.Provider>
  );
}
