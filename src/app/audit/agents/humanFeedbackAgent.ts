/**
 * Phase 2: Human Feedback Learning Agent.
 * Responsibilities: detect patterns in incorrect feedback, trigger recalculation,
 * adjust verification thresholds, and provide context for SLM/Gemini.
 */

import { getIncorrectFeedback, type AuditFeedbackRecord } from '../db/feedback';

export interface HumanFeedbackAnalysis {
  totalIncorrect: number;
  byArtifactType: Record<string, number>;
  suggestedActions: ('reverify' | 'schema_check' | 'calculation_validation')[];
  promptInjection: string;
}

/**
 * Analyze incorrect feedback and produce suggested actions + prompt snippet for engines.
 */
export function runHumanFeedbackAgent(): HumanFeedbackAnalysis {
  const incorrect = getIncorrectFeedback();
  const byArtifactType: Record<string, number> = {};
  for (const r of incorrect) {
    byArtifactType[r.artifact_type] = (byArtifactType[r.artifact_type] ?? 0) + 1;
  }
  const suggestedActions: HumanFeedbackAnalysis['suggestedActions'] = [];
  if (incorrect.some((r) => r.artifact_type === 'metrics')) {
    suggestedActions.push('calculation_validation');
  }
  if (incorrect.some((r) => r.artifact_type === 'tables' || r.artifact_type === 'insights')) {
    suggestedActions.push('reverify');
  }
  if (incorrect.length >= 2 && incorrect.some((r) => r.comment && r.comment.length > 0)) {
    suggestedActions.push('schema_check');
  }
  const promptInjection = buildPromptInjection(incorrect);
  return {
    totalIncorrect: incorrect.length,
    byArtifactType,
    suggestedActions: Array.from(new Set(suggestedActions)),
    promptInjection,
  };
}

function buildPromptInjection(records: AuditFeedbackRecord[]): string {
  if (records.length === 0) return '';
  const lines = records
    .slice(0, 10)
    .map((r) => `- ${r.artifact_type} "${r.artifact_id}": user marked incorrect${r.comment ? ` (comment: ${r.comment})` : ''}`);
  return `User feedback indicates the following may be incorrect. Recalculate and verify where applicable.\n${lines.join('\n')}`;
}

/**
 * Call before SLM/Gemini runs to inject feedback context (e.g. into verify_slm or structured prompt).
 */
export function getFeedbackContextForEngines(): string {
  const analysis = runHumanFeedbackAgent();
  return analysis.promptInjection;
}
