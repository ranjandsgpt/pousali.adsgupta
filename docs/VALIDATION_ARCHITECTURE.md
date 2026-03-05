# Multi-Agent Validation Architecture — Confirmation

## 1. Schema Agent escalation to Gemini

**Implemented.** When schema confidence from header mapping is below 80%:

- **With raw files:** Gemini’s structured response can include `schema_inferences` (raw header → canonical metric + confidence). The pipeline merges these into the Schema Intelligence Agent so confidence can reach ≥80%.
- **Without raw files:** If the pipeline still has unmapped headers (`schemaUnmappedHeaders`), the client calls the `/api/dual-engine` endpoint with `mode: 'infer_schema'` and `payload: { headers: string[] }`. Gemini returns inferred mappings; these are merged and the pipeline is re-run (deferred path). This continues until schema confidence ≥80% or no unmapped headers remain.

Canonical prompts live in `geminiPromptRegistry.ts`: `SCHEMA_INFER_SYSTEM` and `buildSchemaInferUserMessage(headers)`.

---

## 2. Statistical Validator — 50+ rules

**Implemented.** The Statistical Validator has **58** validation rules, including:

- **Metric sanity:** ACOS (>500%, <0, >200%, NaN), ROAS (<0, >100, <0.2, NaN), CTR (>40%, <0%, >30%), CPC (>$50, <0, >$20), CVR (>70%, <0%, >50%), TACOS (<0, >100%, >80%), spend/sales/clicks/impressions/orders/sessions/units/buybox/pageviews/budget invalid or suspicious ranges.
- **Relationship checks:** units > sessions, orders > clicks, impressions < clicks, ad sales > total store sales, spend > total store sales, spend > 10× sales.
- **Distribution/rollup:** max single-keyword spend > account spend (invalid), keyword total spend vs campaign total spend mismatch (anomaly).
- **Financial/other:** organic sales < 0, contribution margin, lost revenue, ad sales %.

When validation does not pass, `needsGeminiEscalation: true` is set so the pipeline/UI can recommend Gemini review. Metrics do not appear in the UI until confidence ≥80% (enforced by the confidence engine and multi-agent gate).

---

## 3. Data Consistency Agent — full coverage

**Implemented.** The agent validates:

- **Base metrics (recomputed from store, compared to SLM/Gemini):** Total Sales, Total Ad Sales, Ad Spend.
- **Derived metrics:** ACOS, ROAS, TACOS, CTR, CPC, CVR (recomputed via `amazonMetricsLibrary`, compared to SLM and Gemini).

Each is recalculated independently and compared to SLM and Gemini outputs. If deviation exceeds 5%, the check is recorded and reconciliation is triggered (inconsistencies array). Confidence must be ≥80% to pass.

---

## 4. CFO-level Data Reconciliation Engine

**Implemented.** The engine acts as a financial controller and verifies:

- `SUM(keyword_spend)` ≈ `campaign_spend` (within 10%).
- `SUM(keyword_sales)` ≈ `campaign_sales` (within 10%).
- `SUM(campaign_spend)` ≈ account spend (within 10%).
- `SUM(campaign_sales)` ≈ account sales (within 10%).
- `SUM(ad_sales)` ≤ total store sales (with 1% tolerance).

On failure, `recomputeRecommended: true` is set and `failures` list the broken checks. No financial metrics are shown in the UI until reconciliation confidence ≥80% (via `financialMetricsAllowed` from the multi-agent pipeline).

---

## 5. Raw file usage by Gemini

**Confirmed.** Gemini receives the original uploaded files when provided:

- The audit page passes `rawFiles: lastFilesRef.current` into `runDualEngine(store, { rawFiles, deferGemini: true, onGeminiComplete })`.
- `fetchGeminiStructured` builds `FormData`, appends each file as `files`, and sends `POST /api/dual-engine` with `multipart/form-data`.
- The API (`/api/dual-engine`, mode `structured`) uploads each blob to Gemini Files and sends `fileData: { fileUri, mimeType }` plus the text prompt. Gemini can inspect raw headers, recover missing fields, and recompute metrics from source data. The same response includes `metrics_gemini`, `tables_gemini`, `charts_gemini`, `insights_gemini`, `recovered_fields`, and `schema_inferences`.

---

## 6. Progressive rendering

**Confirmed.** The UI does not block on Gemini:

1. On upload, SLM runs and **SLM results render immediately** (`setSlmOnlyResult()` when `deferGemini` is true).
2. **Gemini runs in the background** (`fetchGeminiStructured(store, rawFiles)` in a `.then()` chain).
3. When Gemini completes, **confidence is recalculated**, **artifacts are selected**, **multi-agent pipeline runs** (with optional schema escalation), and **`setResult(next)`** updates the UI so confidence and artifacts refresh automatically.
4. The UI shows “AI verification in progress” via `geminiVerificationPending` and, when done, “AI verified — confidence X%” via `auditConfidenceScore`.

---

## 7. Agent test coverage

**Added.** Unit tests in `src/app/audit/agents/__tests__/agents.test.ts` cover:

- **Schema Intelligence Agent:** passed when known headers map, unmapped headers returned, Gemini inferences merged to improve confidence.
- **Statistical Validator:** sane metrics, invalid ACOS/ROAS flagged, many rules executed, `needsGeminiEscalation` present.
- **Data Consistency Agent:** derived and base metrics (Total Sales, Ad Sales, Ad Spend, ACOS, etc.) validated, SLM mismatch >5% flagged.
- **Data Reconciliation Engine:** passes when keyword/campaign totals align, fails when keyword sales ≠ campaign sales or ad sales > total sales, `recomputeRecommended` set on failure.
- **Multi-Agent Pipeline:** recovered fields gated, `financialMetricsAllowed` and `schemaUnmappedHeaders` set.

Run with: `npm run test` or `npm run test:watch`.

---

## 8. Summary

| Item | Status |
|------|--------|
| Schema Agent escalation to Gemini | Implemented (API `infer_schema` + merge from structured `schema_inferences`) |
| Statistical Validator 50+ rules | 58 rules; `needsGeminiEscalation` when not passed |
| Data Consistency full coverage | Total Sales, Ad Sales, Ad Spend + ACOS, ROAS, TACOS, CTR, CPC, CVR |
| CFO Reconciliation | All rollup checks; `recomputeRecommended` on failure |
| Gemini receives raw files | Yes (FormData + file upload in API) |
| Progressive UI (SLM first, Gemini in background) | Yes (`deferGemini`, `geminiVerificationPending`, then `setResult`) |
| Agent unit tests | Added; `npm run test` |
