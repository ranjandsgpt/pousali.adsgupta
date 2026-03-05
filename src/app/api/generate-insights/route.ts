import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

/**
 * Dual Intelligence request payload.
 * Built on the client from the deterministic analytics (SLM) + normalized data.
 *
 * NOTE: This is intentionally a reduced, structured view of the underlying
 * MemoryStore – not raw CSV bytes – but it is rich enough for Gemini to
 * perform independent reasoning and verification.
 */
export interface DualIntelligenceRequest {
  accountSummary: {
    totalStoreSales: number;
    totalAdSales: number;
    totalAdSpend: number;
    tacos: number;
    roas: number;
    acos: number;
    orders: number;
    avgCpc: number;
    conversionRate: number;
    organicSales?: number;
    adSalesPercent?: number;
    wastedSpendEstimate?: number;
  };
  campaigns: Array<{
    campaignName: string;
    spend: number;
    sales: number;
    acos: number;
    budget: number;
  }>;
  searchTerms: Array<{
    searchTerm: string;
    campaign: string;
    spend: number;
    sales: number;
    clicks: number;
    acos: number;
    roas: number;
  }>;
  asins: Array<{
    asin: string;
    adSpend: number;
    adSales: number;
    totalSales: number;
    sessions?: number;
    buyBoxPercent?: number;
  }>;
  /** Deterministic engine findings (patterns) */
  patterns: Array<{
    type: string;
    severity: 'critical' | 'warning' | 'opportunity' | 'info';
    summary: string;
    details?: Record<string, unknown>;
  }>;
  /** Data sanity classification results */
  sanity: {
    wastedKeywords: Array<{
      keyword: string;
      campaign: string;
      spend: number;
      clicks: number;
    }>;
    scalingKeywords: Array<{
      keyword: string;
      campaign: string;
      spend: number;
      sales: number;
      roas: number;
    }>;
    highACOSCampaigns: Array<{
      campaignName: string;
      spend: number;
      sales: number;
      acos: number;
    }>;
    budgetCappedCampaigns: Array<{
      campaignName: string;
      spend: number;
      sales: number;
      budget: number;
    }>;
  };
}

export interface GeminiAuditResponse {
  narrative: string;
  topRisks: string[];
  topOpportunities: string[];
  actionRoadmap: string[];
  verification?: {
    verificationResult: 'agree' | 'partial_disagree' | 'disagree';
    disagreements: string[];
    confidenceScore: number;
  };
}

const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured' },
      { status: 503 }
    );
  }

  let body: DualIntelligenceRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  console.log('Using Gemini model:', model);

  const ai = new GoogleGenAI({ apiKey });

  const dataJson = JSON.stringify(body, null, 2);

  const systemInstruction =
    'You are an Elite Amazon PPC Data Scientist and Agency Strategist. ' +
    'Your goal is to analyze raw Amazon Advertising and Business report data, ' +
    'synthesizing thousands of data points into highly actionable, non-redundant insights. ' +
    'Your analysis must be mathematically verified and strictly focused on profitability ' +
    '(ROAS/ACOS) and wasted spend reduction.';

  try {
    // --- Phase 6: Gemini strategic analysis (executive narrative + risks/opportunities/action roadmap) ---
    const analysisPrompt = [
      systemInstruction,
      '',
      'You are given a structured JSON object named `data` representing normalized Amazon PPC and Business report data,',
      'along with deterministic engine findings (patterns + sanity). Use this data to perform the following steps:',
      '',
      'Step 1: Data Cleaning & Processing',
      '- Treat all numeric fields as already cleaned of currency symbols and percent signs.',
      '- Use the metrics provided to compute and reason about:',
      '  * Overall Ad Spend',
      '  * Ad Sales',
      '  * Organic vs Ad Sales',
      '  * Total ROAS',
      '  * Wasted Spend (from patterns/sanity)',
      '  * Top ASIN conversion behaviour',
      '',
      'Step 2: Insight Generation',
      'Think of your output as the textual summary of a 10-slide executive deck plus an Agency action CSV, built from this data. Generate non-redundant insights covering at minimum:',
      '- Executive Summary (Total Revenue, Ad Share, Overall ROAS)',
      '- Top Performing ASINs (Sales & Conversion Rate)',
      '- Campaign Efficiency (Top campaigns by ROAS / ACOS)',
      '- Targeting Strategy (ROAS by match type and targeting style)',
      '- Search Term Winners (high-converting queries)',
      '- Search Term Graveyard (high spend, zero-sales queries)',
      '- B2B vs B2C opportunity (if Business metrics present)',
      '- Low Conversion Risk (high traffic, low-CR ASINs)',
      '- Brand vs Generic performance (competitor / generic benchmarking)',
      '- Prioritized Action Roadmap (clear next steps for an agency)',
      '',
      'Step 3: Output Format',
      'Return ONLY valid JSON with the following shape:',
      '{',
      '  "executive_narrative": string,',
      '  "top_risks": string[],',
      '  "top_opportunities": string[],',
      '  "action_roadmap": string[]',
      '}',
      '',
      'Do not include any extra commentary or markdown. You are NOT actually running Python or creating PPTX/CSV files here; instead, summarize what those 10 slides and the Agency_Action_Plan.csv would contain, based strictly on the provided data. Do not invent metrics.',
      '',
      '--- data JSON ---',
      dataJson,
    ].join('\n');

    const analysisResult = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [{ text: analysisPrompt }],
        },
      ],
    });

    const analysisText =
      analysisResult.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? '')
        .join('\n')
        .trim() || '';

    let narrative = 'No insights generated';
    let topRisks: string[] = [];
    let topOpportunities: string[] = [];
    let actionRoadmap: string[] = [];

    try {
      const parsed = JSON.parse(analysisText) as {
        executive_narrative?: string;
        top_risks?: string[];
        top_opportunities?: string[];
        action_roadmap?: string[];
      };
      narrative = parsed.executive_narrative || narrative;
      if (Array.isArray(parsed.top_risks)) topRisks = parsed.top_risks;
      if (Array.isArray(parsed.top_opportunities))
        topOpportunities = parsed.top_opportunities;
      if (Array.isArray(parsed.action_roadmap))
        actionRoadmap = parsed.action_roadmap;
    } catch {
      // Fallback: treat raw text as narrative if JSON parsing fails.
      if (analysisText) narrative = analysisText;
    }

    // --- Phase 7: Gemini verification layer (compare deterministic SLM findings vs data) ---
    const verificationPrompt = [
      systemInstruction,
      '',
      'Now act as a verifier of the deterministic analytics engine (SLM).',
      'You are given the same `data` JSON as above. Within this object, the fields',
      '`patterns` and `sanity` represent the internal analytics engine findings.',
      '',
      'Task:',
      '1. Verify whether those SLM findings logically follow from the dataset.',
      '2. Highlight any disagreements, inconsistencies, or missing edge cases.',
      '',
      'Return ONLY valid JSON with the following shape:',
      '{',
      '  "verification_result": "agree" | "partial_disagree" | "disagree",',
      '  "disagreements": string[],',
      '  "confidence_score": number',
      '}',
      '',
      'Do not include any extra commentary or markdown.',
      '',
      '--- data JSON (including SLM findings) ---',
      dataJson,
    ].join('\n');

    const verificationResult = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [{ text: verificationPrompt }],
        },
      ],
    });

    const verificationText =
      verificationResult.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? '')
        .join('\n')
        .trim() || '';

    let verification:
      | {
          verificationResult: 'agree' | 'partial_disagree' | 'disagree';
          disagreements: string[];
          confidenceScore: number;
        }
      | undefined;

    try {
      const vParsed = JSON.parse(verificationText) as {
        verification_result?: string;
        disagreements?: string[];
        confidence_score?: number;
      };
      if (vParsed) {
        const vrRaw =
          (vParsed.verification_result || '').toLowerCase() || 'agree';
        const vr: 'agree' | 'partial_disagree' | 'disagree' =
          vrRaw === 'disagree'
            ? 'disagree'
            : vrRaw === 'partial_disagree'
              ? 'partial_disagree'
              : 'agree';
        verification = {
          verificationResult: vr,
          disagreements: Array.isArray(vParsed.disagreements)
            ? vParsed.disagreements
            : [],
          confidenceScore:
            typeof vParsed.confidence_score === 'number'
              ? vParsed.confidence_score
              : 0,
        };
      }
    } catch {
      // If parsing fails, leave verification undefined.
      verification = undefined;
    }

    const response: GeminiAuditResponse = {
      narrative,
      topRisks,
      topOpportunities,
      actionRoadmap,
      verification,
    };

    return NextResponse.json(response);
  } catch (e) {
    console.error('generate-insights error', e);
    return NextResponse.json(
      {
        narrative:
          'AI insights temporarily unavailable. Please rerun analysis or try again later.',
        topRisks: [],
        topOpportunities: [],
        actionRoadmap: [],
      } satisfies GeminiAuditResponse,
      { status: 200 }
    );
  }
}
