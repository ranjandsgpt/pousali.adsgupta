import { GoogleGenAI } from '@google/genai';
import { assertNoFileReferences, sanitizeTextForGemini } from '@/lib/geminiRequestGuard';
import { extractTextFromGenerateContentResponse } from '@/lib/geminiResponse';

const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * 7-Day Optimization Plan Generator.
 *
 * Converts deterministic insight summaries into a 7-day PPC optimization
 * plan using Gemini. Only the summarized insight text is sent — never raw
 * CSV rows or per-row data.
 */
export async function generateSevenDayOptimizationPlan(
  insightsSummary: string[] | string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const summaryText = Array.isArray(insightsSummary)
    ? insightsSummary.join('\n')
    : String(insightsSummary || '');

  const userPrompt = sanitizeTextForGemini(
    [
      'Generate a concise 7 day Amazon PPC optimization plan using these deterministic insights.',
      '',
      'Insights detected:',
      summaryText || '(no insights provided)',
      '',
      'Output format:',
      'Day 1: ...',
      'Day 2: ...',
      'Day 3: ...',
      'Day 4: ...',
      'Day 5: ...',
      'Day 6: ...',
      'Day 7: ...',
    ].join('\n')
  );

  const contents = [{ role: 'user' as const, parts: [{ text: userPrompt }] }];
  assertNoFileReferences(contents);

  const ai = new GoogleGenAI({ apiKey });
  const result = await ai.models.generateContent({
    model,
    contents,
  });
  return extractTextFromGenerateContentResponse(result);
}

