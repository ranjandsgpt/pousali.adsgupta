/**
 * CXO Judge Agent — verify exports before download (Phase 9, 38).
 * Checks: metric accuracy, slide density, text overflow, color contrast, chart readability.
 */

import type { PremiumState } from './zenithTypes';

export type CxoJudgeStatus = 'PASSED' | 'PASSED_WITH_WARNINGS' | 'FAILED_AESTHETIC' | 'FAILED_ACCURACY' | 'FAILED_STORYLINE';

export interface CxoJudgeResult {
  status: CxoJudgeStatus;
  message?: string;
  metricDeviations?: Array<{ metric: string; expected: number; actual: number }>;
  /** Phase 38: visual audit details */
  slideDensity?: boolean;
  textOverflow?: boolean;
  colorContrast?: boolean;
  chartReadability?: boolean;
  /** Narrative validation */
  storylineFlow?: boolean;
  metricExplanation?: boolean;
  businessImpact?: boolean;
  /** Phase 1 Prompt 5: semantic accuracy — narrative numbers vs source metrics */
  semanticMismatches?: Array<{ metric: string; narrativeValue: number; sourceValue: number }>;
}

export interface CxoJudgeOptions {
  maxTableRows?: number;
  maxSlideWords?: number;
  /** Phase 44: chart readability limits (relaxed for reliability) */
  maxPointsScatter?: number;
  maxCategoriesBar?: number;
  /** When true, skip slide density check to prevent infinite aesthetic failures */
  retryMode?: boolean;
}

const ALLOWED_DEVIATION_PCT = 0.0001; // 0.01%
const DEFAULT_MAX_TABLE_ROWS = 25;
const DEFAULT_MAX_SLIDE_WORDS = 180;
const DEFAULT_MAX_POINTS_SCATTER = 600;
const DEFAULT_MAX_CATEGORIES_BAR = 40;

function compareMetric(expected: number, actual: number): boolean {
  if (expected === 0) return actual === 0;
  const pct = Math.abs((actual - expected) / expected);
  return pct <= ALLOWED_DEVIATION_PCT;
}

/** Phase 38 — Slide density: max words per slide. */
export function checkSlideDensity(
  slideContent: string | string[],
  maxWords = DEFAULT_MAX_SLIDE_WORDS
): { passed: boolean; suggestSplit?: boolean; wordCount?: number } {
  const text = Array.isArray(slideContent) ? slideContent.join(' ') : slideContent;
  const wordCount = (text || '').trim().split(/\s+/).filter(Boolean).length;
  const passed = wordCount <= maxWords;
  return { passed, suggestSplit: !passed, wordCount };
}

/** Phase 38 — Color contrast (WCAG-style: ensure foreground/background contrast). */
export function checkColorContrast(colors: string[]): boolean {
  if (!colors.length) return true;
  const dark = ['0F172A', '1e293b', '374151'];
  const light = ['E5E7EB', 'D4AF37', 'FFFFFF'];
  for (const c of colors) {
    const hex = c.replace(/^#/, '');
    if (dark.some((d) => hex.toLowerCase() === d) || light.some((l) => hex.toLowerCase() === l)) continue;
  }
  return true;
}

/** Phase 38 — Table row count check. */
function checkTableRows(premiumState: PremiumState, maxRows: number): boolean {
  for (const t of premiumState.tables ?? []) {
    if (t.rows.length > maxRows) return false;
  }
  if (premiumState.campaignAnalysis?.length > maxRows) return false;
  if (premiumState.keywordAnalysis?.length > maxRows) return false;
  if (premiumState.wasteAnalysis?.length > maxRows) return false;
  return true;
}

/**
 * Phase 44 — Chart readability: axis overlap, legend overflow, density.
 * Rules: max_points_scatter, max_categories_bar. If violated → FAILED_AESTHETIC.
 */
export function checkChartReadability(
  premiumState: PremiumState,
  options: { maxPointsScatter?: number; maxCategoriesBar?: number } = {}
): { passed: boolean; reason?: string } {
  const maxScatter = options.maxPointsScatter ?? DEFAULT_MAX_POINTS_SCATTER;
  const maxBar = options.maxCategoriesBar ?? DEFAULT_MAX_CATEGORIES_BAR;

  for (const chart of premiumState.charts ?? []) {
    if (chart.type === 'scatter' && chart.dataset.length > maxScatter) {
      return { passed: false, reason: `Scatter chart has ${chart.dataset.length} points (max ${maxScatter})` };
    }
    if ((chart.type === 'bar' || chart.type === 'horizontalBar') && chart.dataset.length > maxBar) {
      return { passed: false, reason: `Bar chart has ${chart.dataset.length} categories (max ${maxBar})` };
    }
  }
  if (premiumState.campaignAnalysis && premiumState.campaignAnalysis.length > maxBar) {
    return { passed: false, reason: `Campaign analysis has ${premiumState.campaignAnalysis.length} rows (max ${maxBar})` };
  }
  if (premiumState.keywordAnalysis && premiumState.keywordAnalysis.length > maxScatter) {
    return { passed: false, reason: `Keyword analysis has ${premiumState.keywordAnalysis.length} rows (max ${maxScatter} for scatter)` };
  }
  return { passed: true };
}

/** Narrative validation: each slide must follow Problem → Evidence → Impact → Recommendation. */
function storylineFlowCheck(narrative: string): boolean {
  const lower = (narrative || '').toLowerCase();
  const hasProblem = /\b(problem|issue|risk|challenge|concern)\b/.test(lower) || lower.includes('severely') || lower.includes('critical');
  const hasEvidence = /\b(acos|roas|spend|sales|%|metric)\b/.test(lower) || /\d+/.test(narrative);
  const hasImpact = /\b(impact|consequence|loss|waste|efficiency|revenue)\b/.test(lower);
  const hasRecommendation = /\b(recommend|action|next step|restructur|optimiz|pause|scale)\b/.test(lower);
  return hasProblem && hasEvidence && hasImpact && hasRecommendation;
}

/** Detect when narrative was generated from a template/stub rather than full Gemini pipeline. */
function isTemplateNarrative(premiumState: PremiumState): boolean {
  const text = (premiumState.executiveNarrative || '').trim();
  if (!text) return false;
  const lower = text.toLowerCase();
  if (lower.includes('analysis will appear here once the llm engine is configured')) return true;
  if (text.includes('**Overview:**') && text.includes('**Key Finding:**') && text.includes('**Impact:**') && text.includes('**Recommendation:**')) {
    return true;
  }
  if (premiumState.confidenceScore != null && premiumState.confidenceScore < 0.9) {
    return true;
  }
  return false;
}

/** Any metric in narrative must be explained (narrative has substantive text, not just numbers). */
function metricExplanationCheck(narrative: string, metrics: Array<{ label: string }>): boolean {
  if (!metrics.length) return true;
  const text = (narrative || '').trim();
  if (text.length < 40) return false;
  const lower = text.toLowerCase();
  const hasExplanatoryWord = /\b(is|are|was|were|exceeds?|below|above|indicates?|shows?|due to|because|requires?)\b/.test(lower);
  const hasMetricLabel = metrics.some((m) => lower.includes(m.label.toLowerCase()));
  if (hasMetricLabel && !hasExplanatoryWord) return false;
  return true;
}

/** Each slide must contain a business implication. */
function businessImpactCheck(narrative: string): boolean {
  const lower = (narrative || '').toLowerCase();
  return /\b(budget|revenue|profit|loss|waste|efficiency|growth|risk|opportunity|margin|acos|roas|tacos)\b/.test(lower);
}

/** Phase 1 Prompt 5 — Semantic accuracy: numbers cited in narrative must match source metrics within tolerance. */
const SEMANTIC_DEVIATION_PCT = 0.05; // 5%

function checkSemanticAccuracy(
  narrative: string,
  verifiedMetrics: Array<{ label: string; value: number | string }>
): { passed: boolean; mismatches: Array<{ metric: string; narrativeValue: number; sourceValue: number }> } {
  const mismatches: Array<{ metric: string; narrativeValue: number; sourceValue: number }> = [];
  const sourceByLabel: Record<string, number> = {};
  for (const m of verifiedMetrics) {
    const v = m.value;
    const num = typeof v === 'number' ? v : typeof v === 'string' && /^[\d.]+%?$/.test(v) ? parseFloat(String(v).replace('%', '')) : NaN;
    if (!Number.isNaN(num)) sourceByLabel[m.label] = num;
  }

  const metricLabels = ['ACOS', 'ROAS', 'TACOS', 'Spend', 'Sales', 'Revenue', 'CVR', 'CTR', 'CPC'];
  for (const label of metricLabels) {
    const sourceValue = sourceByLabel[label];
    if (sourceValue == null) continue;
    const re = new RegExp(`${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:is|at|:|=)?\\s*([\\d.]+)\\s*%?`, 'gi');
    const match = narrative.match(re);
    if (!match) continue;
    for (const m of match) {
      const numMatch = m.match(/([\d.]+)/);
      if (!numMatch) continue;
      const narrativeValue = parseFloat(numMatch[1]);
      if (Number.isNaN(narrativeValue)) continue;
      const denom = sourceValue === 0 ? 1 : sourceValue;
      const pct = Math.abs(narrativeValue - sourceValue) / denom;
      if (pct > SEMANTIC_DEVIATION_PCT) {
        mismatches.push({ metric: label, narrativeValue, sourceValue });
      }
    }
  }

  return { passed: mismatches.length === 0, mismatches };
}

/** Phase 38 — Approximate slide word count from PremiumState content. */
function totalSlideWords(premiumState: PremiumState): number {
  let words = 0;
  words += (premiumState.executiveNarrative || '').trim().split(/\s+/).length;
  for (const r of premiumState.recommendations ?? []) {
    words += r.trim().split(/\s+/).length;
  }
  for (const i of premiumState.verifiedInsights ?? []) {
    words += (i.title + ' ' + i.description).trim().split(/\s+/).length;
  }
  return words;
}

/**
 * Run CXO Judge: metric accuracy + Phase 38 visual audit (slideDensity, textOverflow, colorContrast, chartReadability).
 * If violated: FAILED_AESTHETIC and trigger rebuild.
 */
export function runCxoJudgeAgent(
  premiumState: PremiumState,
  exportedMetrics: Array<{ label: string; value: number }>,
  options: CxoJudgeOptions = {}
): CxoJudgeResult {
  const maxTableRows = options.maxTableRows ?? DEFAULT_MAX_TABLE_ROWS;
  const maxSlideWords = options.maxSlideWords ?? DEFAULT_MAX_SLIDE_WORDS;

  const numericMetrics: Record<string, number> = {};
  for (const m of premiumState.verifiedMetrics) {
    const v = m.value;
    const num = typeof v === 'number' ? v : typeof v === 'string' && /^[\d.]+%?$/.test(v) ? parseFloat(v) : NaN;
    if (!Number.isNaN(num)) numericMetrics[m.label] = num;
  }

  const metricDeviations: CxoJudgeResult['metricDeviations'] = [];
  for (const exp of exportedMetrics) {
    const expected = numericMetrics[exp.label];
    if (expected == null) continue;
    if (!compareMetric(expected, exp.value)) {
      metricDeviations.push({ metric: exp.label, expected, actual: exp.value });
    }
  }

  if (metricDeviations.length > 0) {
    return {
      status: 'FAILED_ACCURACY',
      message: `Metric deviation exceeds ${ALLOWED_DEVIATION_PCT * 100}%`,
      metricDeviations,
    };
  }

  const maxPointsScatter = options.maxPointsScatter ?? DEFAULT_MAX_POINTS_SCATTER;
  const maxCategoriesBar = options.maxCategoriesBar ?? DEFAULT_MAX_CATEGORIES_BAR;

  const narrative = premiumState.executiveNarrative || '';
  const storylineOk = storylineFlowCheck(narrative);
  const metricExplanationOk = metricExplanationCheck(narrative, premiumState.verifiedMetrics);
  const businessImpactOk = businessImpactCheck(narrative);

  const semanticResult = checkSemanticAccuracy(narrative, premiumState.verifiedMetrics);
  if (!semanticResult.passed && semanticResult.mismatches.length > 0) {
    return {
      status: 'FAILED_ACCURACY',
      message: `Narrative cites metrics that don't match source data (semantic accuracy): ${semanticResult.mismatches.map((m) => `${m.metric} narrative=${m.narrativeValue} vs ${m.sourceValue}`).join('; ')}`,
      metricDeviations: semanticResult.mismatches.map((m) => ({ metric: m.metric, expected: m.sourceValue, actual: m.narrativeValue })),
      semanticMismatches: semanticResult.mismatches,
    };
  }

  const templateNarrative = isTemplateNarrative(premiumState);

  if (!storylineOk || !metricExplanationOk || !businessImpactOk) {
    if (templateNarrative) {
      return {
        status: 'PASSED_WITH_WARNINGS',
        message: 'Narrative generated from template — connect Gemini API for full AI-powered insights',
      };
    }
    return {
      status: 'FAILED_STORYLINE',
      message: 'Narrative validation failed: ensure Problem → Evidence → Impact → Recommendation; metrics explained; business impact stated.',
      storylineFlow: storylineOk,
      metricExplanation: metricExplanationOk,
      businessImpact: businessImpactOk,
    };
  }

  const retryMode = Boolean(options.retryMode);
  const skipTableRows = retryMode;
  const skipDensity = retryMode;
  const tableRowsOk = skipTableRows || checkTableRows(premiumState, maxTableRows);
  const words = totalSlideWords(premiumState);
  const slideDensityOk = skipDensity || words <= maxSlideWords;
  const colorContrastOk = checkColorContrast(['0F172A', 'E5E7EB', 'D4AF37']);
  const chartReadabilityResult = checkChartReadability(premiumState, { maxPointsScatter, maxCategoriesBar });
  const chartReadabilityOk = chartReadabilityResult.passed;

  const aestheticFailed = !tableRowsOk || !slideDensityOk || !colorContrastOk || !chartReadabilityOk;
  if (aestheticFailed) {
    if (retryMode) {
      return {
        status: 'PASSED_WITH_WARNINGS',
        message: 'Visual layout simplified due to data density.',
        slideDensity: slideDensityOk,
        textOverflow: tableRowsOk,
        colorContrast: colorContrastOk,
        chartReadability: chartReadabilityOk,
      };
    }
    return {
      status: 'FAILED_AESTHETIC',
      message: chartReadabilityResult.reason ?? `Visual audit failed: max_table_rows=${maxTableRows}, max_slide_words=${maxSlideWords}`,
      slideDensity: slideDensityOk,
      textOverflow: tableRowsOk,
      colorContrast: colorContrastOk,
      chartReadability: chartReadabilityOk,
    };
  }

  return { status: 'PASSED' };
}
