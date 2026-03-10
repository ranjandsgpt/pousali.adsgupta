const executionCounts = new Map<string, number>();

export interface EngineExecutionMonitorOutput {
  count: number;
  warnings: string[];
}

/**
 * Track how many times the metric engine has executed for a given upload/session id.
 * Agents are verification-only; this helper does not modify metric outputs.
 */
export function recordEngineExecution(contextId: string): EngineExecutionMonitorOutput {
  const current = executionCounts.get(contextId) ?? 0;
  const next = current + 1;
  executionCounts.set(contextId, next);

  const warnings: string[] = [];
  if (next > 1) {
    warnings.push(`Metric engine executed ${next} times for context "${contextId}". Expected exactly once per upload.`);
  }

  return { count: next, warnings };
}

