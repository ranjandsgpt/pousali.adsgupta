'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface PendingCopilotQuestionContextValue {
  pendingQuestion: string | null;
  setPendingQuestion: (q: string | null) => void;
}

const PendingCopilotQuestionContext = createContext<PendingCopilotQuestionContextValue | null>(null);

export function PendingCopilotQuestionProvider({ children }: { children: ReactNode }) {
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  return (
    <PendingCopilotQuestionContext.Provider value={{ pendingQuestion, setPendingQuestion }}>
      {children}
    </PendingCopilotQuestionContext.Provider>
  );
}

export function usePendingCopilotQuestion(): PendingCopilotQuestionContextValue {
  const ctx = useContext(PendingCopilotQuestionContext);
  if (!ctx) return { pendingQuestion: null, setPendingQuestion: () => {} };
  return ctx;
}
