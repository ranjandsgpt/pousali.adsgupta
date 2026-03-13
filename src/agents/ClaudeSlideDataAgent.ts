import type { AggregatedMetrics } from '@/lib/aggregateReports';
import { tripleEngine } from '@/lib/tripleEngine';

type CampaignRow = {
  name: string;
  spend: number;
  sales: number;
  acos: number;
};

type WasteTerm = {
  searchTerm: string;
  spend: number;
};

type Opportunity = {
  title: string;
  estimatedImpact: number;
};

export type SlideManifest = {
  executiveSummary: {
    headline: string;
    verdict: string;
    topStat: string;
  };
  slides: Array<{
    id: string;
    headline: string;
    insight: string;
    actions?: Array<{
      number: string;
      title: string;
      detail: string;
      impact: string;
      effort: string;
      timeframe: string;
    }>;
  }>;
  _engineMeta?: {
    modelUsed: 'claude' | 'gemini' | 'slm';
    fallbackUsed: boolean;
    confidence: number;
    warnings: string[];
  };
};

export async function generateSlideContent(
  metrics: AggregatedMetrics,
  campaigns: CampaignRow[],
  wasteTerms: WasteTerm[],
  opportunities: Opportunity[]
): Promise<SlideManifest> {
  const topCampaign = [...campaigns].sort((a, b) => b.sales - a.sales)[0];
  const worstCamp = [...campaigns].sort((a, b) => b.acos - a.acos)[0];
  const totalWaste = wasteTerms.reduce((s, t) => s + t.spend, 0);
  const cur = metrics.currency ?? '£';

  const result = await tripleEngine({
    task: 'slide_content',
    maxTokens: 2000,
    metrics,
    jsonMode: true,

    system: `You are an Amazon advertising analyst generating slide 
content for a CXO-level audit deck.
RULES — follow all of them exactly:
- Return ONLY valid JSON, no other text, no markdown fences
- Every headline must contain at least one specific number
- Never write "performance is improving" or generic statements
- All monetary values must use ${cur} symbol  
- Use ONLY the numbers provided. Never invent or estimate.
- priority_actions must have exactly 3 items
- Each action detail must be 2 sentences maximum`,

    prompt: `Generate slide content JSON for this Amazon audit.

VERIFIED ACCOUNT DATA — use only these numbers:
Total Store Sales:  ${cur}${metrics.totalStoreSales.toFixed(2)}
Ad Spend:           ${cur}${metrics.adSpend.toFixed(2)}
Ad Sales:           ${cur}${metrics.adSales.toFixed(2)}
Organic Sales:      ${cur}${metrics.organicSales.toFixed(2)}
ACOS:               ${metrics.acos ? (metrics.acos * 100).toFixed(1) + '%' : 'N/A'}
TACoS:              ${metrics.tacos ? (metrics.tacos * 100).toFixed(1) + '%' : 'N/A'}
ROAS:               ${metrics.roas ? metrics.roas.toFixed(2) + 'x' : 'N/A'}
Sessions:           ${metrics.sessions.toLocaleString()}
Buy Box:            ${metrics.buyBoxPct != null ? metrics.buyBoxPct.toFixed(1) + '%' : 'N/A'}
Total waste spend:  ${cur}${totalWaste.toFixed(2)} across ${wasteTerms.length} terms
Top campaign:       ${topCampaign?.name ?? 'N/A'} — ACOS ${topCampaign ? (topCampaign.acos * 100).toFixed(1) : '0.0'}%
Worst campaign:     ${worstCamp?.name ?? 'N/A'} — ACOS ${worstCamp ? (worstCamp.acos * 100).toFixed(1) : '0.0'}%
Top 3 opportunities:
${opportunities
      .slice(0, 3)
      .map((o, i) => `${i + 1}. ${o.title}: estimated ${cur}${o.estimatedImpact} impact`)
      .join('\n')}

RETURN THIS EXACT JSON STRUCTURE:
{
  "executiveSummary": {
    "headline": "one sentence, max 12 words, must include a specific number",
    "verdict":  "2-3 sentences conclusion-first, reference specific numbers",
    "topStat":  "the single most important metric and what it means"
  },
  "slides": [
    {
      "id":      "executive_summary",
      "headline": "slide headline with a number",
      "insight":  "2 sentences what this means for the business"
    },
    {
      "id":      "campaign_intelligence",
      "headline": "campaign headline with a number",
      "insight":  "which campaign to prioritise and exactly why"
    },
    {
      "id":      "waste_analysis",
      "headline": "waste headline with £ amount",
      "insight":  "specific action to take this week to recover waste"
    },
    {
      "id":      "priority_actions",
      "headline": "actions headline",
      "insight":  "why these 3 actions in this order",
      "actions": [
        {
          "number":    "01",
          "title":     "specific action title",
          "detail":    "2 sentences with specific numbers",
          "impact":    "${cur}X estimated impact",
          "effort":    "LOW",
          "timeframe": "This week"
        },
        {
          "number":    "02",
          "title":     "specific action title",
          "detail":    "2 sentences with specific numbers",
          "impact":    "${cur}X estimated impact",
          "effort":    "MEDIUM",
          "timeframe": "Next 7 days"
        },
        {
          "number":    "03",
          "title":     "specific action title",
          "detail":    "2 sentences with specific numbers",
          "impact":    "${cur}X estimated impact",
          "effort":    "HIGH",
          "timeframe": "2-3 weeks"
        }
      ]
    }
  ]
}`,

    slmTemplate: JSON.stringify({
      executiveSummary: {
        headline: `{{currency}}{{adSales}} ad-attributed sales on {{currency}}{{adSpend}} spend — {{acos}}% ACOS`,
        verdict: `This account generated {{currency}}{{totalStoreSales}} in total store sales. Ad spend of {{currency}}{{adSpend}} drove {{currency}}{{adSales}} in attributed revenue at {{acos}}% ACOS. TACoS of {{tacos}}% indicates ad contribution relative to total store performance.`,
        topStat:
          'ROAS {{roas}}x — every {{currency}}1 spent returned {{currency}}{{roas}} in attributed sales',
      },
      slides: [
        {
          id: 'executive_summary',
          headline: '{{currency}}{{totalStoreSales}} total sales — {{acos}}% ACOS',
          insight:
            'Ad spend drove {{currency}}{{adSales}} of total revenue at {{roas}}x ROAS. TACoS of {{tacos}}% reflects total advertising cost of sale.',
        },
        {
          id: 'campaign_intelligence',
          headline: '{{acos}}% blended ACOS — review campaign allocation',
          insight:
            'Review campaigns by ACOS and reallocate budget from high-ACOS to low-ACOS campaigns to improve overall efficiency.',
        },
        {
          id: 'waste_analysis',
          headline: 'Zero-conversion spend identified — immediate action required',
          insight:
            'Keywords with spend and zero attributed sales should be reviewed and negated to recover wasted budget.',
        },
        {
          id: 'priority_actions',
          headline: '3 actions to improve account performance',
          insight:
            'These actions are ordered by speed of impact and effort required.',
          actions: [
            {
              number: '01',
              title: 'Negate zero-conversion keywords',
              detail:
                'Review search terms with spend and zero sales. Add as negatives immediately.',
              impact: 'Quick win',
              effort: 'LOW',
              timeframe: 'This week',
            },
            {
              number: '02',
              title: 'Reallocate budget to top performers',
              detail:
                'Shift budget from high-ACOS campaigns to low-ACOS campaigns.',
              impact: 'Medium term',
              effort: 'MEDIUM',
              timeframe: 'Next 7 days',
            },
            {
              number: '03',
              title: 'Fix zero-CVR ASIN listings',
              detail:
                'Improve product listings for ASINs with active spend and zero conversion rate.',
              impact: 'Long term',
              effort: 'HIGH',
              timeframe: '2-3 weeks',
            },
          ],
        },
      ],
    }),
  });

  const manifest = JSON.parse(result.text) as SlideManifest;
  manifest._engineMeta = {
    modelUsed: result.modelUsed ?? 'slm',
    fallbackUsed: result.fallbackUsed ?? false,
    confidence: result.confidence ?? 0,
    warnings: result.warnings ?? [],
  };

  return manifest;
}

