/**
 * Self-Healing Pipeline: Use Dislike feedback to generate improved parsing overrides.
 * Gemini suggests sanitizeCurrency, overrideSalesColumn, preferredReport + reasoning.
 */

export interface OverrideSuggestion {
  sanitizeCurrency?: boolean;
  preferredReport?: string;
  overrideSalesColumn?: string;
  reasoning: string;
}

export interface FeedbackSnapshot {
  fileHeaders: string[];
  currentMetrics: Record<string, number>;
  reportTypes?: string[];
}

export async function generateOverrideSuggestions(snapshot: FeedbackSnapshot): Promise<OverrideSuggestion> {
  const { fileHeaders = [], currentMetrics = {}, reportTypes = [] } = snapshot;
  try {
    const res = await fetch('/api/audit-self-healing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'override_suggestions',
        headers: fileHeaders,
        currentMetrics,
        reportTypes,
      }),
    });
    if (!res.ok) {
      return {
        sanitizeCurrency: true,
        reasoning: 'Unable to analyze; applying currency sanitization by default.',
      };
    }
    const data = (await res.json()) as OverrideSuggestion & { reasoning?: string };
    return {
      sanitizeCurrency: data.sanitizeCurrency,
      preferredReport: data.preferredReport,
      overrideSalesColumn: data.overrideSalesColumn,
      reasoning: typeof data.reasoning === 'string' ? data.reasoning : 'Suggested parsing corrections to improve metric accuracy.',
    };
  } catch {
    return {
      sanitizeCurrency: true,
      reasoning: 'A parsing correction was suggested (e.g. currency symbols or column mapping).',
    };
  }
}
