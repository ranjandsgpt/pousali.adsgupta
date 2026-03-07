'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import type { ValidatedArtifactsState } from './validatedArtifacts';
import {
  EMPTY_VALIDATED_ARTIFACTS,
  buildValidatedArtifacts,
  shouldAcceptValidatedArtifacts,
} from './validatedArtifacts';
import type { ValidatedArtifactsInput } from './validatedArtifacts';

interface ValidatedArtifactsContextValue {
  validated: ValidatedArtifactsState;
  setValidated: (input: ValidatedArtifactsInput | null) => void;
  reset: () => void;
}

const Context = createContext<ValidatedArtifactsContextValue | null>(null);

export function useValidatedArtifacts() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useValidatedArtifacts must be used within ValidatedArtifactsProvider');
  return ctx;
}

export function ValidatedArtifactsProvider({ children }: { children: ReactNode }) {
  const [validated, setValidatedState] = useState<ValidatedArtifactsState>(EMPTY_VALIDATED_ARTIFACTS);

  const setValidated = useCallback((input: ValidatedArtifactsInput | null) => {
    if (input == null) {
      setValidatedState(EMPTY_VALIDATED_ARTIFACTS);
      return;
    }
    if (!shouldAcceptValidatedArtifacts(input.confidence)) {
      setValidatedState(EMPTY_VALIDATED_ARTIFACTS);
      return;
    }
    setValidatedState(buildValidatedArtifacts(input));
  }, []);

  const reset = useCallback(() => {
    setValidatedState(EMPTY_VALIDATED_ARTIFACTS);
  }, []);

  return (
    <Context.Provider value={{ validated, setValidated, reset }}>
      {children}
    </Context.Provider>
  );
}
