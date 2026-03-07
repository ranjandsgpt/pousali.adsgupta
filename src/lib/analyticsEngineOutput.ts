/**
 * Step 13 — Analytics engine output format.
 * Feeds the dual-engine insight pipeline (SLM + Gemini).
 */

export interface AnalyticsEngineOutput {
  metrics: Record<string, number>;
  validations: Record<string, { valid: boolean; expected: number; reported: number; differencePct: number; validationFlag: boolean }>;
  forecasts: Record<string, number>;
  insightsInput: Record<string, unknown>;
}

/** Build empty output structure. */
export function createEmptyAnalyticsOutput(): AnalyticsEngineOutput {
  return {
    metrics: {},
    validations: {},
    forecasts: {},
    insightsInput: {},
  };
}

/** Merge resolved metrics into output. */
export function mergeMetricsIntoOutput(
  output: AnalyticsEngineOutput,
  metrics: Record<string, number>
): void {
  Object.assign(output.metrics, metrics);
}

/** Merge validation results into output. */
export function mergeValidationsIntoOutput(
  output: AnalyticsEngineOutput,
  validations: Record<string, { valid: boolean; expected: number; reported: number; differencePct: number; validationFlag: boolean }>
): void {
  Object.assign(output.validations, validations);
}

/** Merge forecasts into output. */
export function mergeForecastsIntoOutput(
  output: AnalyticsEngineOutput,
  forecasts: Record<string, number>
): void {
  Object.assign(output.forecasts, forecasts);
}

/** Set insights input (e.g. store summary, requested metrics, relationship map). */
export function setInsightsInput(
  output: AnalyticsEngineOutput,
  input: Record<string, unknown>
): void {
  output.insightsInput = { ...output.insightsInput, ...input };
}
