import type { AggregatedMetrics } from '@/lib/aggregateReports';
import { tripleEngine } from '@/lib/tripleEngine';

export type InsightCard = {
  title: string;
  text: string;
  type: 'info' | 'warning' | 'success';
};

export async function generateInsightCards(
  metrics: AggregatedMetrics,
  section: 'overview' | 'campaigns' | 'waste' | 'asins' | 'acos'
): Promise<InsightCard[]> {
  const result = await tripleEngine({
    task: 'insight_card',
    maxTokens: 400,
    metrics,
    jsonMode: true,

    system: `You generate insight cards for an Amazon advertising 
dashboard. Each card must be specific, actionable, and data-grounded.
Rules:
- Return ONLY a JSON array of insight objects
- Each insight: max 2 sentences
- Every insight must contain at least one number from the data
- Never write vague statements like "performance could be improved"
- section "${section}" only — do not generate insights for other sections`,

    prompt: `Generate 2-3 insight cards for the "${section}" section.
    
Data: ${JSON.stringify(metrics, null, 2)}

Return: [{ "title": "short title", "text": "insight text", "type": "info|warning|success" }]`,

    slmTemplate: JSON.stringify([
      {
        title: 'Account overview',
        text: `Ad spend of {{currency}}{{adSpend}} generated {{currency}}{{adSales}} in attributed sales at {{acos}}% ACOS and {{roas}}x ROAS.`,
        type: 'info',
      },
    ]),
  });

  return JSON.parse(result.text) as InsightCard[];
}

