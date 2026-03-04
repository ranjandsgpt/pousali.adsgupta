'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import type { MemoryStore } from '../utils/reportParser';
import { computeTACOS, computeROAS } from '../utils/mathEngine';
import { createEmptyStore } from '../utils/reportParser';

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
    const totalSales = store.totalStoreSales;
    const totalSpend = store.totalAdSpend;
    setState({
      store,
      globalTACOS: computeTACOS(totalSpend, totalSales),
      blendedROAS: totalSpend > 0 ? computeROAS(totalSales, totalSpend) : 0,
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
