/**
 * Formula Registry — Human-readable formulas for transparency (aligned with amazonMetricsLibrary).
 * Used when user asks "How did you calculate ACOS?" etc.
 */

export interface FormulaEntry {
  name: string;
  formula: string;
  source: string;
}

const FORMULAS: FormulaEntry[] = [
  { name: 'ACOS', formula: 'ACOS = (Ad Spend / Ad Sales) × 100', source: 'amazonMetricsLibrary' },
  { name: 'ROAS', formula: 'ROAS = Ad Sales / Ad Spend', source: 'amazonMetricsLibrary' },
  { name: 'TACOS', formula: 'TACOS = (Ad Spend / Total Store Sales) × 100', source: 'amazonMetricsLibrary' },
  { name: 'CPC', formula: 'CPC = Ad Spend / Clicks', source: 'amazonMetricsLibrary' },
  { name: 'CTR', formula: 'CTR = (Clicks / Impressions) × 100', source: 'amazonMetricsLibrary' },
  { name: 'CVR', formula: 'CVR = (Orders / Clicks) × 100', source: 'amazonMetricsLibrary' },
  { name: 'Total Sales', formula: 'Total Store Sales = Ad Sales + Organic Sales (Organic = Total − Ad)', source: 'amazonMetricsLibrary' },
  { name: 'Organic Sales', formula: 'Organic Sales = Total Store Sales − Ad Sales', source: 'amazonMetricsLibrary' },
  { name: 'Wasted Spend', formula: 'Wasted Spend = sum of spend where attributed sales = 0', source: 'amazonMetricsLibrary' },
  { name: 'Contribution Margin', formula: 'Contribution Margin % = (Ad Sales − Ad Spend) / Ad Sales × 100', source: 'amazonMetricsLibrary' },
];

/**
 * Get formula explanation for a metric (e.g. ACOS, ROAS, total sales).
 */
export function getFormulaForMetric(question: string): string | null {
  const q = (question || '').toLowerCase();
  for (const entry of FORMULAS) {
    if (q.includes(entry.name.toLowerCase())) {
      return `${entry.name}: ${entry.formula}. Source: ${entry.source}.`;
    }
  }
  if (/\bcalculat(e|ion)|formula\b/i.test(question)) {
    return `Formulas used in this audit (from amazonMetricsLibrary):\n${FORMULAS.map((e) => `• ${e.name}: ${e.formula}`).join('\n')}`;
  }
  return null;
}
