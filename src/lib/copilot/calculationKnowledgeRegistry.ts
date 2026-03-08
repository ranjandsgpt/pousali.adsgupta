/**
 * Phase 16 — Copilot Calculation Knowledge Integration.
 * Copilot reads this registry to answer "How is TACOS calculated?" etc.
 */

import { getCalculation } from '@/metrics/calculationRegistry';

export interface CalculationKnowledge {
  formula: string;
  explanation: string;
  source?: string;
}

const COPILOT_OVERRIDES: Record<string, CalculationKnowledge> = {
  tacos: {
    formula: 'Ad Spend / Total Sales',
    explanation: 'TACOS measures how much ad spend contributes to total revenue. Total Sales = Ad Sales + Organic Sales.',
  },
  acos: {
    formula: 'Ad Spend / Ad Sales',
    explanation: 'ACOS is the percentage of ad-attributed sales spent on advertising.',
  },
  roas: {
    formula: 'Ad Sales / Ad Spend',
    explanation: 'ROAS is return on ad spend: revenue generated per unit of spend.',
  },
  wastedKeywords: {
    formula: 'clicks >= 10 AND sales = 0',
    explanation: getCalculation('wastedKeywords')?.definition ?? 'Wasted keywords are search terms with at least 10 clicks and zero sales, from the Search Term Report.',
    source: 'Search Term Report',
  },
};

export function getCalculationKnowledge(key: string): CalculationKnowledge | undefined {
  const over = COPILOT_OVERRIDES[key];
  if (over) return over;
  const entry = getCalculation(key);
  if (!entry) return undefined;
  return {
    formula: entry.formula,
    explanation: entry.definition,
    source: entry.source,
  };
}

export function getCalculationAnswer(question: string): string | null {
  const q = question.toLowerCase();
  if (/\btacos\b/.test(q)) {
    const k = getCalculationKnowledge('tacos');
    return k ? `${k.explanation} Formula: ${k.formula}.` : null;
  }
  if (/\bacos\b/.test(q)) {
    const k = getCalculationKnowledge('acos');
    return k ? `${k.explanation} Formula: ${k.formula}.` : null;
  }
  if (/\broas\b/.test(q)) {
    const k = getCalculationKnowledge('roas');
    return k ? `${k.explanation} Formula: ${k.formula}.` : null;
  }
  if (/\bwasted?\s*(keyword|spend|budget)\b|\bwaste\b.*\bkeyword\b/.test(q)) {
    const k = getCalculationKnowledge('wastedKeywords');
    return k ? k.explanation : null;
  }
  if (/\b(total\s*)?sales\b/.test(q) && /how|calculat|formula|what\s+is/.test(q)) {
    const k = getCalculationKnowledge('totalSales');
    return k ? `${k.explanation} Formula: ${k.formula}.` : null;
  }
  return null;
}
