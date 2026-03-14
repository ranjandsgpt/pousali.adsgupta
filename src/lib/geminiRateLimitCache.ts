/**
 * Phase 1 Prompt 3 — Gemini rate limit, response cache, and budget manager.
 * Used by dual-engine and other Gemini API routes to avoid overuse and reuse identical responses.
 */

const RATE_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_MAX_PER_WINDOW = 30; // max requests per window per client
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const BUDGET_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const BUDGET_MAX_REQUESTS = 200; // max Gemini requests per hour (global)

/** Client key (e.g. IP or 'anonymous'). */
function getClientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'anonymous';
}

/** In-memory rate limit: client -> timestamps in current window. */
const rateBuckets = new Map<string, number[]>();

function pruneOldTimestamps(timestamps: number[], windowMs: number): number[] {
  const cutoff = Date.now() - windowMs;
  return timestamps.filter((t) => t > cutoff);
}

export function checkRateLimit(request: Request): { allowed: boolean; retryAfterSeconds?: number } {
  const client = getClientKey(request);
  let timestamps = rateBuckets.get(client) ?? [];
  timestamps = pruneOldTimestamps(timestamps, RATE_WINDOW_MS);
  rateBuckets.set(client, timestamps);

  if (timestamps.length >= RATE_MAX_PER_WINDOW) {
    const oldest = Math.min(...timestamps);
    const retryAfterSeconds = Math.ceil((oldest + RATE_WINDOW_MS - Date.now()) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
  }
  timestamps.push(Date.now());
  rateBuckets.set(client, timestamps);
  return { allowed: true };
}

/** Global budget: timestamps of requests in current window. */
let budgetTimestamps: number[] = [];

function checkBudget(): { allowed: boolean; retryAfterSeconds?: number } {
  budgetTimestamps = pruneOldTimestamps(budgetTimestamps, BUDGET_WINDOW_MS);
  if (budgetTimestamps.length >= BUDGET_MAX_REQUESTS) {
    const oldest = Math.min(...budgetTimestamps);
    const retryAfterSeconds = Math.ceil((oldest + BUDGET_WINDOW_MS - Date.now()) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
  }
  return { allowed: true };
}

/** Call once per Gemini API request when the request is about to be made. */
export function consumeBudget(): void {
  budgetTimestamps = pruneOldTimestamps(budgetTimestamps, BUDGET_WINDOW_MS);
  budgetTimestamps.push(Date.now());
}

/** Stable cache key from mode + payload (JSON stringified, sorted keys for consistency). */
function cacheKey(mode: string, payload: unknown): string {
  const str = typeof payload === 'object' && payload !== null
    ? JSON.stringify(payload, Object.keys(payload as object).sort())
    : JSON.stringify(payload);
  return `gemini:${mode}:${str}`;
}

interface CacheEntry {
  body: unknown;
  ts: number;
}

const responseCache = new Map<string, CacheEntry>();
const MAX_CACHE_ENTRIES = 100;

export function getCachedResponse(mode: string, payload: unknown): unknown | null {
  const key = cacheKey(mode, payload);
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }
  return entry.body;
}

export function setCachedResponse(mode: string, payload: unknown, body: unknown): void {
  const key = cacheKey(mode, payload);
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const first = responseCache.keys().next().value;
    if (first) responseCache.delete(first);
  }
  responseCache.set(key, { body, ts: Date.now() });
}

/**
 * Run rate limit + budget checks. Returns null if allowed; otherwise returns
 * a NextResponse to return to the client (429 with Retry-After).
 */
export function enforceGeminiLimits(request: Request): Response | null {
  const rate = checkRateLimit(request);
  if (!rate.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        retryAfterSeconds: rate.retryAfterSeconds,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rate.retryAfterSeconds ?? 60),
        },
      }
    );
  }
  const budget = checkBudget();
  if (!budget.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Gemini request budget exceeded. Try again later.',
        retryAfterSeconds: budget.retryAfterSeconds,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(budget.retryAfterSeconds ?? 300),
        },
      }
    );
  }
  return null;
}
