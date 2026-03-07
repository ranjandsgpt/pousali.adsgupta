/**
 * Re-export from canonical registry. All Gemini prompts live in @/lib/geminiPromptRegistry.
 * No inline prompts in route handlers. This file is kept for backward compatibility.
 */
export {
  VERIFY_SLM_PROMPT,
  buildVerifySlmUserMessage,
  STRUCTURED_FROM_RAW_SYSTEM,
  STRUCTURED_FROM_RAW_USER_PREFIX,
  STRUCTURED_FROM_JSON_USER_PREFIX,
  SCHEMA_INFER_SYSTEM,
  buildSchemaInferUserMessage,
  INSIGHT_NARRATIVE_PROMPT,
  INSIGHT_NARRATIVE_USER_PREFIX,
  PRESENTATION_GENERATION_PROMPT,
  PRESENTATION_GENERATION_USER_PREFIX,
} from '@/lib/geminiPromptRegistry';

import { VERIFY_SLM_PROMPT } from '@/lib/geminiPromptRegistry';

/** @deprecated Use VERIFY_SLM_PROMPT (Mode 1 strict JSON contract). */
export const VERIFY_SLM_SYSTEM = VERIFY_SLM_PROMPT;

/** @deprecated Use INSIGHT_NARRATIVE_PROMPT; narrative is now plain text only (Mode 2). */
export const NARRATIVE_SYSTEM_INSTRUCTION = 'See INSIGHT_NARRATIVE_PROMPT in @/lib/geminiPromptRegistry.';

/** @deprecated Use INSIGHT_NARRATIVE_USER_PREFIX; narrative is now plain text only (Mode 2). */
export const NARRATIVE_USER_PREFIX = 'See INSIGHT_NARRATIVE_USER_PREFIX in @/lib/geminiPromptRegistry.';
