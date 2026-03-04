'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { LearningDB } from './types';
import { loadLearningDB } from './learningStore';
import { extractPatternsAndUpdateLearning, getCrossAccountInsights } from './patternExtraction';
import type { MemoryStore } from '../utils/reportParser';

interface LearningContextValue {
  learning: LearningDB | null;
  crossAccountInsights: Array<{ text: string; confidence: number }>;
  refresh: () => Promise<void>;
  runLearning: (store: MemoryStore) => Promise<void>;
}

const LearningContext = createContext<LearningContextValue>({
  learning: null,
  crossAccountInsights: [],
  refresh: async () => {},
  runLearning: async () => {},
});

export function useLearning() {
  const ctx = useContext(LearningContext);
  if (!ctx) throw new Error('useLearning must be used within LearningProvider');
  return ctx;
}

export function LearningProvider({ children }: { children: ReactNode }) {
  const [learning, setLearning] = useState<LearningDB | null>(null);
  const [crossAccountInsights, setCrossAccountInsights] = useState<Array<{ text: string; confidence: number }>>([]);

  const refresh = useCallback(async () => {
    const db = await loadLearningDB();
    setLearning(db);
  }, []);

  const runLearning = useCallback(async (store: MemoryStore) => {
    const db = await extractPatternsAndUpdateLearning(store);
    setLearning(db);
    const insights = getCrossAccountInsights(store, db);
    setCrossAccountInsights(insights);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <LearningContext.Provider
      value={{ learning, crossAccountInsights, refresh, runLearning }}
    >
      {children}
    </LearningContext.Provider>
  );
}
