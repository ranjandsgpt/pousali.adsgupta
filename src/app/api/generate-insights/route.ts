import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

/**
 * Request payload: normalized account summary, campaigns, search terms, ASINs,
 * patterns, and sanity classifications. Built on the client from MemoryStore.
 */
export interface DualIntelligenceRequest {
  accountSummary: Record<string, unknown>;
  campaigns: unknown[];
  searchTerms: unknown[];
  asins: unknown[];
  patterns: unknown[];
  sanity: Record<string, unknown>;
}

const SYSTEM_INSTRUCTION =
  'You are an Elite Amazon PPC Data Scientist and Agency Strategist.\n\n' +
  'Your task is to analyze Amazon Advertising datasets and produce a highly actionable strategic audit report for an Amazon seller.\n\n' +
  'You must identify wasted ad spend, campaign inefficiencies, scaling opportunities, and structural problems.\n\n' +
  'Your insights should resemble what a senior Amazon advertising consultant would present to a client.\n\n' +
  'Avoid generic advice and focus strictly on profitability, ROAS, ACOS, and wasted spend.';

const USER_PROMPT_PREFIX =
  'I have uploaded 5 Amazon account reports:\n\n' +
  'Sponsored Products Search Term Report\n' +
  'Sponsored Products Advertised Product Report\n' +
  'Sponsored Products Targeting Report\n' +
  'Amazon Business Report\n' +
  'Campaign Performance Report\n\n' +
  'Please perform a deep-dive data analysis and generate a comprehensive 10-page executive insight report.\n\n' +
  'Step 1 — Data Processing\n\n' +
  'The uploaded dataset has already been normalized.\n' +
  'All currency symbols, commas, and percentage formatting have been removed.\n' +
  'Focus on analyzing the dataset rather than reloading files.\n\n' +
  'Step 2 — Insight Generation\n\n' +
  'Generate ten distinct and non-redundant sections.\n\n' +
  '1. Executive Summary\n' +
  '   Explain overall account health, total revenue, ad dependency, and profitability.\n\n' +
  '2. Top Performing ASINs\n' +
  '   Identify the ASINs generating the strongest sales and conversion rates.\n\n' +
  '3. Campaign Efficiency\n' +
  '   Identify campaigns delivering strong ROAS and campaigns wasting spend.\n\n' +
  '4. Targeting Strategy\n' +
  '   Analyze match type performance and targeting structure.\n\n' +
  '5. Search Term Winners\n' +
  '   Highlight converting keywords that drive revenue.\n\n' +
  '6. Search Term Graveyard\n' +
  '   Identify keywords spending money without generating sales.\n\n' +
  '7. B2B Opportunity\n' +
  '   Analyze the proportion of B2B vs B2C sales.\n\n' +
  '8. Low Conversion Risk\n' +
  '   Identify products receiving traffic but failing to convert.\n\n' +
  '9. Competitor Benchmarking\n' +
  '   Identify competitor keyword targeting patterns.\n\n' +
  '10. Prioritized Action Roadmap\n' +
  '    Provide a ranked list of optimization actions.\n\n' +
  'Step 3 — Output Format\n\n' +
  'Return a human-readable executive audit report.\n' +
  'The report should be formatted as clear sections with headings.\n' +
  'Avoid JSON.\n' +
  'Avoid repeating raw numbers excessively.\n' +
  'Explain insights in plain business language suitable for Amazon sellers.\n\n' +
  'Step 4 — Metric verification\n' +
  'Before concluding, verify parsed metric consistency: e.g. ad sales ≤ total sales, sessions ≥ clicks, no impossible or extreme ACOS/ROAS values, no missing traffic data where expected. If you detect inconsistencies or anomalies, add a short "Verification warnings" section at the end listing them.\n\n' +
  '---\n\n' +
  'Normalized dataset (JSON for analysis):\n\n';

const FAILSAFE_MESSAGE =
  'AI analysis temporarily unavailable. Please rerun analysis.';

const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured', report: FAILSAFE_MESSAGE },
      { status: 503 }
    );
  }

  let body: DualIntelligenceRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', report: FAILSAFE_MESSAGE },
      { status: 400 }
    );
  }

  const dataJson = JSON.stringify(body, null, 2);
  const userPrompt = USER_PROMPT_PREFIX + dataJson;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model,
      config: { systemInstruction: SYSTEM_INSTRUCTION },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    });

    const text =
      result.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? '')
        .join('\n')
        .trim() || '';

    if (!text) {
      return NextResponse.json({ report: FAILSAFE_MESSAGE }, { status: 200 });
    }
    return NextResponse.json({ report: text }, { status: 200 });
  } catch (e) {
    console.error('generate-insights error', e);
    return NextResponse.json(
      { report: FAILSAFE_MESSAGE },
      { status: 200 }
    );
  }
}
