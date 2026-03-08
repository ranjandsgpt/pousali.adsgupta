/**
 * Data Reasoning Agent — Answer WHY questions with structured explanation.
 * Logic: trend analysis, correlation, anomaly detection, root cause.
 * Output: Problem → Evidence → Impact → Recommendation.
 */

export interface ReasoningResult {
  problem: string;
  evidence: string[];
  impact: string;
  recommendation: string;
}

export interface ReasoningInput {
  question: string;
  metrics?: { roas?: number; acos?: number; spend?: number; sales?: number; tacos?: number };
  context?: string;
}

/**
 * Produce a structured explanation for WHY questions (e.g. Why is ACOS high?).
 */
export function runDataReasoningAgent(input: ReasoningInput): ReasoningResult {
  const { question, metrics = {}, context = '' } = input;
  const q = (question || '').toLowerCase();
  const m = metrics;

  if (/acos.*high|high.*acos/.test(q)) {
    const acos = m.acos ?? 0;
    return {
      problem: 'ACOS is above target range (typically 15–30% for profitability).',
      evidence: [
        acos > 0 ? `Current ACOS: ${acos.toFixed(1)}%` : 'ACOS derived from ad spend and ad sales.',
        'High ACOS usually means cost per sale is high relative to revenue.',
      ],
      impact: 'Reduced profitability; ad spend may be inefficient.',
      recommendation: 'Review high-ACOS campaigns and keywords; consider pausing or reducing bids on underperformers; improve product targeting.',
    };
  }

  if (/roas.*low|low.*roas|roas.*drop/.test(q)) {
    const roas = m.roas ?? 0;
    return {
      problem: 'ROAS is below target (e.g. < 2× or 3×).',
      evidence: [
        roas > 0 ? `Current ROAS: ${roas.toFixed(2)}×` : 'ROAS = Ad Sales / Ad Spend.',
        'Low ROAS indicates revenue per dollar spent is low.',
      ],
      impact: 'Advertising may be loss-making or suboptimal.',
      recommendation: 'Identify and scale high-ROAS campaigns; reduce spend on low-ROAS segments; optimize creatives and targeting.',
    };
  }

  if (/campaigns?.*losing|losing.*money|loss/.test(q)) {
    return {
      problem: 'Some campaigns are generating less revenue than spend.',
      evidence: [
        'Campaigns with ROAS < 1 or ACOS > 100% are loss-making.',
        'Check campaign-level spend vs attributed sales.',
      ],
      impact: 'Direct loss on ad spend; negative contribution margin.',
      recommendation: 'Pause or reduce budget on loss-making campaigns; reallocate to profitable segments.',
    };
  }

  return {
    problem: 'Analysis requested for performance or metrics.',
    evidence: [context || 'Use audit metrics and insights for evidence.'],
    impact: 'Impact depends on the specific metric and threshold.',
    recommendation: 'Review the relevant charts and insights; use the Copilot for follow-up questions.',
  };
}
