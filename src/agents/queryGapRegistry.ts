/**
 * Query Gap Registry — Record frequently asked unsupported questions for future capability improvements.
 * Used by Query Intelligence Agent when capability is unknown or out_of_scope.
 */

export interface QueryGapEntry {
  question: string;
  normalized: string;
  intent: string;
  capability: string;
  firstSeen: string; // ISO
  count: number;
}

const gapStore: QueryGapEntry[] = [];
const MAX_ENTRIES = 200;

function normalizeForGap(q: string): string {
  return (q || '').trim().toLowerCase().slice(0, 200);
}

/**
 * Record an unsupported or out-of-scope question for future analysis.
 */
export function recordQueryGap(question: string, intent: string, capability: string): void {
  const normalized = normalizeForGap(question);
  if (!normalized) return;
  const existing = gapStore.find((e) => e.normalized === normalized);
  if (existing) {
    existing.count += 1;
    return;
  }
  if (gapStore.length >= MAX_ENTRIES) {
    gapStore.sort((a, b) => a.count - b.count);
    gapStore.shift();
  }
  gapStore.push({
    question: (question || '').trim().slice(0, 500),
    normalized,
    intent,
    capability,
    firstSeen: new Date().toISOString(),
    count: 1,
  });
}

/**
 * Get recorded gaps, sorted by frequency (desc).
 */
export function getQueryGaps(): QueryGapEntry[] {
  return [...gapStore].sort((a, b) => b.count - a.count);
}

/**
 * Get top N unsupported questions for capability planning.
 */
export function getTopQueryGaps(n: number = 20): QueryGapEntry[] {
  return getQueryGaps().slice(0, n);
}
