/**
 * Query Router — Detect user intent and route to SLM vs Gemini.
 * Calculation → SLM; Explanation → Gemini; Strategy → Gemini + SLM.
 */

export type QueryIntent =
  | 'explanation'
  | 'calculation'
  | 'strategy'
  | 'forecast'
  | 'diagnostic';

export type EngineRoute = 'slm' | 'gemini' | 'gemini+slm';

export interface QueryRouteResult {
  intent: QueryIntent;
  engine: EngineRoute;
  normalizedQuery: string;
}

const EXPLANATION_PATTERNS = [
  /\bwhy\b/i,
  /\bwhat (is|are|does|do)\b/i,
  /\bexplain\b/i,
  /\breason\b/i,
  /\bhow (does|do)\b/i,
];

const CALCULATION_PATTERNS = [
  /\bhow much\b/i,
  /\bcalculate\b/i,
  /\bwhat (is|are) (the )?(total|sum|average)\b/i,
  /\bpercentage\b/i,
];

const STRATEGY_PATTERNS = [
  /\boptimize\b/i,
  /\bwhich (keywords|campaigns) (should|to)\b/i,
  /\bshould I (pause|scale)\b/i,
  /\brecommend\b/i,
  /\bwaste\b/i,
  /\bscale\b/i,
  /\bpause\b/i,
];

const FORECAST_PATTERNS = [
  /\bwhat happens if\b/i,
  /\bif we (increase|reduce)\b/i,
  /\bforecast\b/i,
];

const DIAGNOSTIC_PATTERNS = [
  /\brisk\b/i,
  /\bissue\b/i,
  /\bworst\b/i,
  /\bwasting\b/i,
  /\bperformance\b/i,
];

export function routeQuery(userQuestion: string): QueryRouteResult {
  const q = (userQuestion || '').trim();
  const normalizedQuery = q.slice(0, 500);

  if (!q) {
    return { intent: 'explanation', engine: 'gemini', normalizedQuery: q };
  }

  const hasExplanation = EXPLANATION_PATTERNS.some((r) => r.test(q));
  const hasCalculation = CALCULATION_PATTERNS.some((r) => r.test(q));
  const hasStrategy = STRATEGY_PATTERNS.some((r) => r.test(q));
  const hasForecast = FORECAST_PATTERNS.some((r) => r.test(q));
  const hasDiagnostic = DIAGNOSTIC_PATTERNS.some((r) => r.test(q));

  if (hasCalculation && !hasStrategy && !hasExplanation) {
    return { intent: 'calculation', engine: 'slm', normalizedQuery };
  }
  if (hasForecast) {
    return { intent: 'forecast', engine: 'slm', normalizedQuery };
  }
  if (hasStrategy || (hasDiagnostic && /which|what should/i.test(q))) {
    return { intent: 'strategy', engine: 'gemini+slm', normalizedQuery };
  }
  if (hasDiagnostic) {
    return { intent: 'diagnostic', engine: 'gemini+slm', normalizedQuery };
  }
  if (hasExplanation) {
    return { intent: 'explanation', engine: 'gemini', normalizedQuery };
  }

  return { intent: 'explanation', engine: 'gemini', normalizedQuery };
}
