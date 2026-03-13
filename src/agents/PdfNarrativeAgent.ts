import type { AggregatedMetrics } from '@/lib/aggregateReports';
import { tripleEngine } from '@/lib/tripleEngine';

type Opportunity = {
  title: string;
  estimatedImpact: number;
};

export async function generatePdfNarrative(
  metrics: AggregatedMetrics,
  opportunities: Opportunity[]
): Promise<{ narrative: string; modelUsed: string; confidence: number }> {
  const cur = metrics.currency ?? '£';

  const topOpportunity = opportunities[0];

  const result = await tripleEngine({
    task: 'pdf_narrative',
    maxTokens: 600,
    metrics,

    system: `You are writing the executive summary page of a 
professional Amazon advertising audit report. 
Audience: CFO or brand director, 90 seconds to read.
Rules:
- Exactly 4 paragraphs, each 2-3 sentences
- Paragraph 1: situation (most important finding first)
- Paragraph 2: what is working and why (specific campaigns/metrics)
- Paragraph 3: what needs fixing and cost of inaction
- Paragraph 4: 3 recommended actions with expected outcomes
- Every claim must reference a number from the data provided
- Tone: direct, confident, no fluff
- No bullet points — flowing prose only`,

    prompt: `Write the executive summary for this Amazon advertising audit.

DATA:
Total Store Sales:  ${cur}${metrics.totalStoreSales.toFixed(2)}
Ad Spend:           ${cur}${metrics.adSpend.toFixed(2)}
Ad Sales:           ${cur}${metrics.adSales.toFixed(2)}
ACOS:               ${metrics.acos ? (metrics.acos * 100).toFixed(1) + '%' : 'N/A'}
TACoS:              ${metrics.tacos ? (metrics.tacos * 100).toFixed(1) + '%' : 'N/A'}
ROAS:               ${metrics.roas ? metrics.roas.toFixed(2) + 'x' : 'N/A'}
Health Score:       ${metrics.sessionCvr != null ? (metrics.sessionCvr * 100).toFixed(1) : 'N/A'}/100
Top opportunity:    ${topOpportunity?.title ?? 'N/A'} — ${cur}${topOpportunity?.estimatedImpact ?? 0} impact

Write 4 paragraphs of flowing prose. No headers. No bullets.`,

    slmTemplate: `This Amazon Advertising account generated {{currency}}{{totalStoreSales}} in total store sales during the audit period. Advertising drove {{currency}}{{adSales}} in attributed revenue, representing a {{acos}}% Advertising Cost of Sale (ACOS) on {{currency}}{{adSpend}} in total ad spend.

The account's Total Advertising Cost of Sale (TACoS) stands at {{tacos}}%, reflecting the proportion of total revenue that advertising spend represents. A ROAS of {{roas}}x indicates that each pound invested in advertising returned {{roas}} pounds in attributed sales.

Budget efficiency varies significantly across campaigns. Campaigns operating above the account's breakeven ACOS represent the primary opportunity for optimisation, and reallocation of spend to higher-efficiency campaigns could materially improve overall ROAS.

Three actions are recommended in priority order: first, pause or negate zero-conversion search terms to immediately recover wasted spend; second, reallocate budget from above-breakeven campaigns to the highest-ROAS campaigns; and third, review product listings for ASINs with active spend and zero conversion rate.`,
  });

  return {
    narrative: result.text,
    modelUsed: result.modelUsed ?? 'slm',
    confidence: result.confidence ?? 0,
  };
}

