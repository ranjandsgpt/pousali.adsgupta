'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

export const PIPELINE_STAGES = [
  'file_upload',
  'header_detection',
  'report_type_classification',
  'currency_normalization',
  'column_mapping',
  'report_parsing',
  'metric_computation',
  'pattern_detection',
  'sanity_validation',
  'cross_report_validation',
  'gemini_analysis',
  'gemini_verification',
  'insight_rendering',
] as const;

export type PipelineStageId = (typeof PIPELINE_STAGES)[number];
export type PipelineStageStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface PipelineStageState {
  status: PipelineStageStatus;
  error?: string;
}

export type PipelineState = Record<PipelineStageId, PipelineStageState>;

const initialStageState = (): PipelineStageState => ({
  status: 'idle',
});

function createInitialPipelineState(): PipelineState {
  const state = {} as PipelineState;
  for (const id of PIPELINE_STAGES) {
    state[id] = initialStageState();
  }
  return state;
}

interface PipelineContextValue {
  pipeline: PipelineState;
  setStage: (stageId: PipelineStageId, status: PipelineStageStatus, error?: string) => void;
  resetPipeline: () => void;
  isRunning: boolean;
}

const PipelineContext = createContext<PipelineContextValue | null>(null);

export function usePipeline() {
  const ctx = useContext(PipelineContext);
  if (!ctx) throw new Error('usePipeline must be used within PipelineProvider');
  return ctx;
}

export function PipelineProvider({ children }: { children: ReactNode }) {
  const [pipeline, setPipeline] = useState<PipelineState>(createInitialPipelineState);

  const setStage = useCallback(
    (stageId: PipelineStageId, status: PipelineStageStatus, error?: string) => {
      setPipeline((prev) => ({
        ...prev,
        [stageId]: { status, error },
      }));
    },
    []
  );

  const resetPipeline = useCallback(() => {
    setPipeline(createInitialPipelineState());
  }, []);

  const isRunning =
    PIPELINE_STAGES.some((id) => pipeline[id].status === 'running') ||
    (pipeline.report_parsing?.status === 'completed' &&
      pipeline.insight_rendering?.status !== 'completed' &&
      pipeline.gemini_analysis?.status !== 'failed');

  return (
    <PipelineContext.Provider
      value={{ pipeline, setStage, resetPipeline, isRunning }}
    >
      {children}
    </PipelineContext.Provider>
  );
}

export const PIPELINE_STAGE_LABELS: Record<PipelineStageId, string> = {
  file_upload: 'Reports Uploaded',
  header_detection: 'Header Detection',
  report_type_classification: 'Report Type Classification',
  currency_normalization: 'Currency Normalization',
  column_mapping: 'Column Mapping',
  report_parsing: 'Data Parsing',
  metric_computation: 'Metrics Computed',
  pattern_detection: 'Pattern Detection',
  sanity_validation: 'Sanity Validation',
  cross_report_validation: 'Cross-Report Validation',
  gemini_analysis: 'Gemini Strategic Analysis',
  gemini_verification: 'Gemini Insight Verification',
  insight_rendering: 'Insight Rendering',
};
