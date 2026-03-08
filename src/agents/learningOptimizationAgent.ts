/**
 * Phase 30 — Continuous Learning Agent.
 * Analyzes feedback to improve insight ranking and detect missing capabilities.
 */

export interface LearningSignal {
  type: 'like' | 'dislike' | 'copilot_query' | 'insight_click';
  entityId: string;
  payload?: Record<string, unknown>;
  timestamp: number;
}

const MAX_SIGNALS = 500;
const signals: LearningSignal[] = [];

export function recordLearningSignal(signal: LearningSignal): void {
  signals.push({ ...signal, timestamp: Date.now() });
  if (signals.length > MAX_SIGNALS) signals.shift();
}

export function getLearningSignals(): LearningSignal[] {
  return [...signals];
}

export function getInsightRankingHints(): { insightId: string; scoreDelta: number }[] {
  const likes = new Map<string, number>();
  const dislikes = new Map<string, number>();
  for (const s of signals) {
    if (s.type === 'like') likes.set(s.entityId, (likes.get(s.entityId) ?? 0) + 1);
    if (s.type === 'dislike') dislikes.set(s.entityId, (dislikes.get(s.entityId) ?? 0) + 1);
  }
  const result: { insightId: string; scoreDelta: number }[] = [];
  const allIds = Array.from(new Set([...Array.from(likes.keys()), ...Array.from(dislikes.keys())]));
  for (const id of allIds) {
    const l = likes.get(id) ?? 0;
    const d = dislikes.get(id) ?? 0;
    result.push({ insightId: id, scoreDelta: l - d });
  }
  return result.sort((a, b) => b.scoreDelta - a.scoreDelta);
}
