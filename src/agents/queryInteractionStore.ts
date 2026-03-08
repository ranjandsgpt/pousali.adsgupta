/**
 * Query Interaction Store — Capture each Copilot query for Central Feedback Agent.
 * Links responseId to { question, intent, capability, answer } so feedback (👍/👎) can be associated.
 */

export interface QueryInteractionRecord {
  question: string;
  intent: string;
  capability: string;
  answer: string;
  responseId: string;
  timestamp: string;
}

const store = new Map<string, QueryInteractionRecord>();
const MAX_SIZE = 500;

export function recordQueryInteraction(
  responseId: string,
  data: { question: string; intent: string; capability: string; answer: string }
): void {
  if (store.size >= MAX_SIZE) {
    const firstKey = store.keys().next().value;
    if (firstKey) store.delete(firstKey);
  }
  store.set(responseId, {
    ...data,
    responseId,
    timestamp: new Date().toISOString(),
  });
}

export function getQueryInteraction(responseId: string): QueryInteractionRecord | undefined {
  return store.get(responseId);
}

export function getRecentQueryInteractions(n: number = 50): QueryInteractionRecord[] {
  const list = Array.from(store.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return list.slice(0, n);
}
