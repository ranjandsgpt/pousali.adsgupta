# Metrics Resolution — System First, CSV Fallback

The platform uses a **three-tier priority** for metrics. The 510-metric CSV is a **fallback calculation library**, not an auto-compute list.

## Priority order

| Priority | Source | When used |
|----------|--------|-----------|
| **1** | **Existing system** | Values already computed by `amazonMetricsLibrary`, aggregation, and MemoryStore (e.g. ACOS, ROAS, TACOS, CTR, CPC, CVR, ad spend, ad sales, sessions). |
| **2** | **SLM + Gemini** | When the AI decides a derived metric is needed (e.g. “explain ROAS drop” → request CPC, CVR, CTR, ASP). Only the requested metric is resolved. |
| **3** | **CSV library** | Fallback when the metric is not implemented in the system and is requested by SLM, Gemini, a validation rule, or the insight engine. |

## When the CSV is used

The CSV (metrics dictionary + formula repository) is used **only** when:

- The calculation is **not** already implemented in the system
- **SLM or Gemini** determines that a derived metric is required
- A **validation rule** needs the formula (e.g. to check ACOS = Spend / Sales)
- The **insight engine** needs supporting metrics

We **do not** iterate or compute all 510 metrics. Lookup is **by metric name** when one of the above requests it.

## API (from `@/lib/amazonMetricsKnowledgeBase`)

- **`resolveMetric(name, systemValues, requestedBy?)`** — System first, then CSV fallback. Returns `{ value, source: 'system' | 'computed' }` or `{ available: false, reason }`.
- **`resolveMetricWithPriority(name, systemValues, requestedBy)`** — Same as above with explicit `requestedBy`: `'slm' | 'gemini' | 'validation' | 'insight' | 'chart'`.
- **`computeMetricWhenRequested(name, systemValues, requestedBy)`** — Lazy compute only when requested.
- **`getFormulaForMetric(name)`** — Formula string from the CSV (for validation or AI context). Does not compute.
- **`getAvailableFallbackMetricNames()`** — List of metric names in the CSV (so SLM/Gemini know what can be requested).
- **`isSystemComputedMetric(name)`** — Whether the existing system already computes this metric.

## Loading the 510-metric CSV

1. Place the CSV file in `public/` or serve it via your API.
2. Fetch the CSV text and call **`loadMetricsFromCsv(csvText)`** once (e.g. at app init or when the audit page loads).
3. The CSV is merged into the in-memory dictionary; core metrics (ACOS, ROAS, TACOS, CTR, CPC, CVR, Buy Box %) remain as built-in fallbacks if the CSV omits them.
