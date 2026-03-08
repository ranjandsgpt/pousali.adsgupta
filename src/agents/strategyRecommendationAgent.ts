/**
 * Strategic Recommendation Agent — Generate actionable recommendations.
 * Uses: trend agent, reasoning agent, brand intelligence, structured insights.
 */

export interface Recommendation {
  action: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  target?: string;
}

export interface StrategyInput {
  trendSignals?: Array<{ metric: string; direction: string; interpretation: string }>;
  reasoning?: { problem: string; recommendation: string };
  highAcosCampaigns?: string[];
  highRoasKeywords?: string[];
  wasteKeywords?: string[];
}

/**
 * Produce prioritized recommendations from signals and insights.
 */
export function runStrategyRecommendationAgent(input: StrategyInput): Recommendation[] {
  const recs: Recommendation[] = [];
  const { trendSignals = [], reasoning, highAcosCampaigns = [], highRoasKeywords = [], wasteKeywords = [] } = input;

  if (highAcosCampaigns.length) {
    recs.push({
      action: 'Pause or reduce bids on high-ACOS campaigns',
      priority: 'high',
      reason: 'Improve profitability',
      target: highAcosCampaigns.slice(0, 5).join(', '),
    });
  }
  if (highRoasKeywords.length) {
    recs.push({
      action: 'Scale budget on high-ROAS keywords',
      priority: 'high',
      reason: 'Capitalize on efficient segments',
      target: highRoasKeywords.slice(0, 5).join(', '),
    });
  }
  if (wasteKeywords.length) {
    recs.push({
      action: 'Pause or add as negative keywords',
      priority: 'high',
      reason: 'Reduce wasted spend (zero sales)',
      target: wasteKeywords.slice(0, 5).join(', '),
    });
  }
  if (reasoning?.recommendation) {
    recs.push({
      action: reasoning.recommendation.slice(0, 120),
      priority: 'medium',
      reason: reasoning.problem?.slice(0, 80) ?? 'From reasoning agent',
    });
  }
  trendSignals.forEach((t) => {
    if (t.direction === 'down' && /roas|sales|conversion/i.test(t.metric)) {
      recs.push({
        action: 'Investigate declining ' + t.metric,
        priority: 'medium',
        reason: t.interpretation,
      });
    }
  });
  return recs.slice(0, 10);
}
