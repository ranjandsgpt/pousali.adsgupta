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

export interface AuditState {
  store: MemoryStore;
  /** Derived for UI */
  globalTACOS: number;
  blendedROAS: number;
}

const defaultState: AuditState = {
  store: createEmptyStore(),
  globalTACOS: 0,
  blendedROAS: 0,
};

const AuditStoreContext = createContext<{
  state: AuditState;
  setStore: (store: MemoryStore) => void;
  reset: () => void;
}>({
  state: defaultState,
  setStore: () => {},
  reset: () => {},
});

export function useAuditStore() {
  const ctx = useContext(AuditStoreContext);
  if (!ctx) throw new Error('useAuditStore must be used within AuditStoreProvider');
  return ctx;
}

export function AuditStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuditState>(defaultState);

  const setStore = useCallback((store: MemoryStore) => {
    const canonical = executeMetricEngineForStore(store);
    setState({
      store,
      globalTACOS: canonical.tacos * 100,
      blendedROAS: canonical.roas,
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      store: createEmptyStore(),
      globalTACOS: 0,
      blendedROAS: 0,
    });
  }, []);

  return (
    <AuditStoreContext.Provider value={{ state, setStore, reset }}>
      {children}
    </AuditStoreContext.Provider>
  );
}
