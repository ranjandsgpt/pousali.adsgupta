/**
 * Semantic Query Cache — Cache frequently executed queries for speed.
 */

const cache = new Map<string, { result: unknown; ts: number }>();
const TTL_MS = 60_000;
const MAX_ENTRIES = 200;

function cacheKey(parsed: { dataset: string; metric?: string; sort?: string; limit?: number }): string {
  const parts = [parsed.dataset, parsed.metric ?? '', parsed.sort ?? '', String(parsed.limit ?? '')];
  return parts.join('_').toLowerCase().replace(/\s+/g, '');
}

export function getCachedQuery<T>(parsed: { dataset: string; metric?: string; sort?: string; limit?: number }): T | null {
  const key = cacheKey(parsed);
  const entry = cache.get(key);
  if (!entry || Date.now() - entry.ts > TTL_MS) return null;
  return entry.result as T;
}

export function setCachedQuery(parsed: { dataset: string; metric?: string; sort?: string; limit?: number }, result: unknown): void {
  if (cache.size >= MAX_ENTRIES) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  cache.set(cacheKey(parsed), { result, ts: Date.now() });
}
