import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const SCHEMA_MAP_SYSTEM = `You are an Amazon Ads report schema mapper. Given an array of CSV column headers from Amazon (which may vary by locale or report type), map them to canonical metric field names. Return ONLY valid JSON with no markdown or code fences.

Canonical fields: totalSales (store/revenue, e.g. Ordered Product Sales), adSpend (ad cost), adSales (attributed ad sales), clicks, impressions, orders (units/order items).

Return a single JSON object. Keys are canonical field names, values are the exact header string from the input that best matches. Omit any canonical field that has no matching header.

Example: {"totalSales": "Ordered Product Sales (£)", "adSpend": "Ad Spend", "adSales": "7 Day Total Sales"}`;

const DIAGNOSTIC_SYSTEM = `You are an Amazon PPC data quality critic. You receive report headers, sample row values, and computed canonical metrics. Detect parsing or logic issues that could cause wrong KPIs.

Check for: AdSales > TotalSales; ACOS > 500%; OrganicSales < 0; NaN or missing metrics; currency symbols (£ $ €) or comma-formatted numbers in numeric fields.

Return ONLY a single JSON object. No markdown. Format:
{"status": "ok" | "warning" | "error", "rootCause": "short description or null", "suggestedFix": {"regex": "optional pattern to strip", "overrideColumn": "optional column name", "fallbackReport": "optional report type"} or null}

Use suggestedFix only when you identified a fix (e.g. currency symbols → regex "[£$,]").`;

const OVERRIDE_SUGGESTIONS_SYSTEM = `You are an Amazon Ads self-healing assistant. The user rejected the current metrics (e.g. ACOS 212%, Total Sales 0). Suggest corrections to parsing/configuration only—never change calculation formulas.

Suggestions you may return: sanitizeCurrency (strip £ $ € ,), overrideSalesColumn (use this header for store sales), preferredReport (campaign | advertised_product | targeting for ad totals). You MUST also include a "reasoning" string explaining why this correction was suggested, for user trust.

Return ONLY a single JSON object. No markdown. Required format:
{"sanitizeCurrency": boolean, "preferredReport": string or null, "overrideSalesColumn": string or null, "reasoning": "1-2 sentences explaining the suggested correction"}`;

function extractJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    if (text[i] === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1)) as Record<string, unknown>;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 });
  }
  let body: {
    action: 'map_headers' | 'diagnostic' | 'override_suggestions';
    headers?: string[];
    sampleRows?: Record<string, unknown>[];
    canonicalMetrics?: Record<string, number>;
    currentMetrics?: Record<string, number>;
    reportTypes?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey });
  const { action } = body;

  if (action === 'map_headers') {
    const headers = body.headers;
    if (!Array.isArray(headers) || headers.length === 0) {
      return NextResponse.json({ error: 'Missing or empty headers' }, { status: 400 });
    }
    const prompt = `Map these Amazon Ads report headers to canonical fields.\n\nHeaders:\n${JSON.stringify(headers)}\n\nReturn JSON mapping: totalSales, adSpend, adSales, clicks, impressions, orders (use exact header strings as values).`;
    try {
      const result = await ai.models.generateContent({
        model: MODEL,
        config: { systemInstruction: SCHEMA_MAP_SYSTEM },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const text = (result as { text?: string }).text ?? '';
      const obj = extractJson(text);
      const mapping: Record<string, string> = {};
      if (obj) {
        for (const k of ['totalSales', 'adSpend', 'adSales', 'clicks', 'impressions', 'orders']) {
          if (typeof obj[k] === 'string') mapping[k] = obj[k];
        }
      }
      return NextResponse.json(mapping);
    } catch (e) {
      console.error('audit-self-healing map_headers', e);
      return NextResponse.json({}, { status: 200 });
    }
  }

  if (action === 'diagnostic') {
    const { headers = [], sampleRows = [], canonicalMetrics = {} } = body;
    const prompt = `Headers: ${JSON.stringify(headers)}\n\nSample rows (first 3): ${JSON.stringify(sampleRows.slice(0, 3))}\n\nCanonical metrics: ${JSON.stringify(canonicalMetrics)}\n\nReturn validation JSON (status, rootCause, suggestedFix).`;
    try {
      const result = await ai.models.generateContent({
        model: MODEL,
        config: { systemInstruction: DIAGNOSTIC_SYSTEM },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const text = (result as { text?: string }).text ?? '';
      const obj = extractJson(text);
      const status = (obj?.status === 'warning' || obj?.status === 'error') ? obj.status : 'ok';
      return NextResponse.json({
        status,
        rootCause: typeof obj?.rootCause === 'string' ? obj.rootCause : undefined,
        suggestedFix: obj?.suggestedFix && typeof obj.suggestedFix === 'object' ? obj.suggestedFix : undefined,
      });
    } catch (e) {
      console.error('audit-self-healing diagnostic', e);
      return NextResponse.json({ status: 'ok' });
    }
  }

  if (action === 'override_suggestions') {
    const { headers = [], currentMetrics = {}, reportTypes = [] } = body;
    const prompt = `The user rejected these Amazon Ads calculations.\n\nCurrent Metrics:\n${JSON.stringify(currentMetrics)}\n\nHeaders:\n${JSON.stringify(headers)}\n\nReport types: ${reportTypes.join(', ') || 'unknown'}\n\nSuggest corrections: sanitizeCurrency, overrideSalesColumn, preferredReport. Include "reasoning" explaining why. Return JSON only.`;
    try {
      const result = await ai.models.generateContent({
        model: MODEL,
        config: { systemInstruction: OVERRIDE_SUGGESTIONS_SYSTEM },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const text = (result as { text?: string }).text ?? '';
      const obj = extractJson(text);
      const sanitizeCurrency = obj?.sanitizeCurrency === true;
      const preferredReport = typeof obj?.preferredReport === 'string' ? obj.preferredReport : undefined;
      const overrideSalesColumn = typeof obj?.overrideSalesColumn === 'string' ? obj.overrideSalesColumn : undefined;
      const reasoning = typeof obj?.reasoning === 'string' ? obj.reasoning : 'Suggested parsing corrections to improve metric accuracy.';
      return NextResponse.json({
        sanitizeCurrency,
        preferredReport: preferredReport || undefined,
        overrideSalesColumn: overrideSalesColumn || undefined,
        reasoning,
      });
    } catch (e) {
      console.error('audit-self-healing override_suggestions', e);
      return NextResponse.json({
        sanitizeCurrency: true,
        reasoning: 'Currency or number formatting may have caused parsing errors. Try enabling currency sanitization.',
      });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
