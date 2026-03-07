/**
 * Central Feedback Agent — Aggregate feedback, detect repeated errors, generate correction signals.
 * Feeds HumanFeedbackAgent and prompt context for Gemini/SLM.
 */

import { getFeedback, type AuditFeedbackRecord, type AuditFeedbackArtifactType } from '../db/feedback';

export interface CentralFeedbackAnalysis {
  totalFeedback: number;
  byArtifactType: Record<AuditFeedbackArtifactType, number>;
  incorrectByArtifact: Record<string, number>;
  repeatedCorrections: string[];
  suggestedActions: ('reverify_metrics' | 'schema_check' | 'recalculate' | 'prompt_context')[];
  promptContextSnippet: string;
}

/**
 * Aggregate feedback and detect patterns (e.g. ACOS frequently marked incorrect).
 */
export function runCentralFeedbackAgent(): CentralFeedbackAnalysis {
  const all = getFeedback();
  const incorrect = all.filter((r) => r.feedback === 'incorrect');
  const byArtifactType: Record<string, number> = {};
  const incorrectByArtifact: Record<string, number> = {};
  for (const r of all) {
    byArtifactType[r.artifact_type] = (byArtifactType[r.artifact_type] ?? 0) + 1;
  }
  for (const r of incorrect) {
    const key = `${r.artifact_type}:${r.artifact_id}`;
    incorrectByArtifact[key] = (incorrectByArtifact[key] ?? 0) + 1;
  }
  const repeatedCorrections = Object.entries(incorrectByArtifact)
    .filter(([, count]) => count >= 2)
    .map(([key]) => key);
  const suggestedActions: CentralFeedbackAnalysis['suggestedActions'] = [];
  if (incorrect.some((r) => r.artifact_type === 'metrics')) {
    suggestedActions.push('reverify_metrics', 'recalculate');
  }
  if (incorrect.some((r) => r.artifact_type === 'copilot_response' || r.artifact_type === 'insights')) {
    suggestedActions.push('prompt_context');
  }
  if (repeatedCorrections.length > 0) {
    suggestedActions.push('schema_check');
  }
  const promptContextSnippet = buildPromptContextSnippet(incorrect, repeatedCorrections);
  return {
    totalFeedback: all.length,
    byArtifactType: byArtifactType as Record<AuditFeedbackArtifactType, number>,
    incorrectByArtifact,
    repeatedCorrections,
    suggestedActions: Array.from(new Set(suggestedActions)),
    promptContextSnippet,
  };
}

function buildPromptContextSnippet(incorrect: AuditFeedbackRecord[], repeated: string[]): string {
  if (incorrect.length === 0) return '';
  const lines: string[] = [];
  if (repeated.length > 0) {
    lines.push('Previous users frequently marked the following as incorrect. Re-evaluate reasoning carefully.');
    repeated.slice(0, 5).forEach((key) => lines.push(`- ${key}`));
  }
  incorrect.slice(0, 5).forEach((r) => {
    lines.push(`- ${r.artifact_type} "${r.artifact_id}": marked incorrect${r.comment ? ` (${r.comment})` : ''}`);
  });
  return lines.join('\n');
}
