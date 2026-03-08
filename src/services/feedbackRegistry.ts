/**
 * Phase 14 — Central Feedback Registry.
 * Store feedback: reportId, userFeedback, timestamp, affectedSection.
 */

export interface FeedbackEntry {
  reportId: string;
  userFeedback: 'like' | 'dislike';
  timestamp: number;
  affectedSection?: string;
  metricId?: string;
  comment?: string;
}

const MAX_ENTRIES = 200;
const entries: FeedbackEntry[] = [];

export function registerFeedback(entry: Omit<FeedbackEntry, 'timestamp'>): void {
  entries.push({ ...entry, timestamp: Date.now() });
  if (entries.length > MAX_ENTRIES) entries.shift();
}

export function getRecentFeedback(limit = 50): FeedbackEntry[] {
  return [...entries].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}
