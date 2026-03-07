# Gemini API Integration — Audit & Fix

## End-to-end flow (AI Audit Narrative)

1. **Trigger:** After reports are uploaded and parsed, `page.tsx` calls `runGemini(store, { rawFiles, onComplete })`.
2. **Client:** `GeminiReportContext.runGemini` builds a payload (accountSummary, campaigns, searchTerms, asins, patterns, sanity, metricsReferenceContext) and POSTs to `/api/generate-insights` (JSON or multipart if raw files).
3. **API:** `generate-insights/route.ts`:
   - Checks `GEMINI_API_KEY`; if missing, returns 503 with `report: FAILSAFE_MESSAGE`.
   - Builds system instruction from `INSIGHT_NARRATIVE_PROMPT` (+ optional metrics reference).
   - Builds user message: normalized dataset JSON (+ "No raw files attached..." if no files).
   - Calls `callGeminiNarrative(ai, systemInstruction, userText, rawFiles)` which:
     - Optionally uploads raw files to Gemini and attaches them.
     - Calls `ai.models.generateContent({ model, config: { systemInstruction }, contents })`.
     - **Extracts text** from the response (see fix below).
   - Validates response with `validateNarrativeResponse(lastRaw)` (plain text expected; JSON/code handled).
   - Returns `{ report }` (200) or `{ report: FAILSAFE_MESSAGE, errorCode?, errorDetail? }` (200) on failure.
4. **Client:** If `data.report` is the failsafe message or includes "temporarily unavailable", sets error and shows "AI analysis temporarily unavailable. Please rerun analysis." (now appends `errorDetail` when present).

## Root cause of "AI analysis temporarily unavailable"

The **@google/genai** SDK exposes the generated text via a **`.text` accessor** on the response object, not only via `result.candidates?.[0]?.content?.parts`. The code was only reading `candidates[0].content.parts[].text`; in some SDK versions or response shapes that path can be empty or different, so we got empty text → validation/empty path → API returned `FAILSAFE_MESSAGE` → UI showed the error.

## Fixes applied

### 1. Response text extraction (all Gemini call sites)

- **Added** `src/lib/geminiResponse.ts`: `extractTextFromGenerateContentResponse(result)`.
  - Uses `(result as { text?: string }).text` first (SDK accessor).
  - Fallback: `result.candidates?.[0]?.content?.parts?.map(p => p.text).join('')`.
- **Updated**:
  - `src/app/api/generate-insights/route.ts` — `callGeminiNarrative` now returns `extractTextFromGenerateContentResponse(result)`.
  - `src/app/api/dual-engine/route.ts` — infer_schema, verify_slm, and structured modes use the helper.
  - `src/app/api/copilot/route.ts` — already using the helper.

### 2. API error reporting (generate-insights)

- On empty Gemini response: set `errorCode: 'gemini_empty'`, `errorDetail: 'Gemini returned no text. Check model name and API quota.'`.
- On validation failure: set `errorCode: 'validation_failed'`, `errorDetail: validation.reason`.
- On catch: set `errorCode: 'gemini_error'`, `errorDetail: errMsg.slice(0, 200)`.
- Response body now includes `errorCode` and `errorDetail` when the report is the failsafe message, so the client can show a more specific message.

### 3. Client error display (GeminiReportContext)

- When `!res.ok`: show `data.error` and append `data.errorDetail` if present.
- When report is failsafe: show base message and append `data.errorDetail` so users see e.g. "Gemini returned no text" or the actual exception message.
- In catch: show a short slice of the exception message (up to 100 chars).

### 4. Validation relaxation (geminiResponseValidation)

- If the response looks like JSON but has no `narrative` / `report` / `text` / `content` field, and the raw text length is > 200, we now accept it and use the raw text as the narrative instead of failing with `response_was_json_no_narrative_field`.

## Expected response from Gemini (narrative mode)

- **Format:** Plain text (Executive Summary, Key Risks, Growth Opportunities, Strategic Recommendations with bullets/paragraphs). No JSON, no code.
- **If Gemini returns JSON or code:** Validator either extracts a known field or (after fix) uses raw text if long enough.

## Probable errors and checks

| Symptom | Check |
|--------|--------|
| "GEMINI_API_KEY is not configured" | Set `GEMINI_API_KEY` in `.env` (see `.env.example`). |
| "Gemini returned no text" | Model name (e.g. `GEMINI_MODEL=gemini-2.0-flash`), quota, or API error; inspect server logs and `logs/gemini-responses/`. |
| "validation_failed" / "response_was_code" | Gemini returned code instead of prose; prompt or model may need tuning. |
| "response_was_json_no_narrative_field" | Now mitigated by using raw text when length > 200. |
| Network / timeout | Check server logs; consider increasing timeout or retrying. |

## Double-check list

- [x] All Gemini `generateContent` call sites use `extractTextFromGenerateContentResponse`.
- [x] generate-insights returns `errorCode` and `errorDetail` on failure.
- [x] Client surfaces `errorDetail` in the UI.
- [x] Validation accepts long JSON-as-text when no narrative field is found.
- [x] Build passes.
