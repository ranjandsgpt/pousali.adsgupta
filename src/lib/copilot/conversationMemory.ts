/**
 * Copilot conversation memory — previous questions, responses, referenced entities.
 * Used to resolve follow-up references ("What should I do about that campaign?").
 */

export interface ConversationTurn {
  question: string;
  response: string;
  /** Extracted or inferred campaign names from this turn */
  referencedCampaigns: string[];
  /** Extracted or inferred keyword/search terms from this turn */
  referencedKeywords: string[];
}

export interface ConversationMemory {
  previousQuestions: string[];
  previousResponses: string[];
  referencedCampaigns: string[];
  referencedKeywords: string[];
  turns: ConversationTurn[];
}

const MAX_TURNS = 20;
const MAX_REFERENCED = 50;
/** Phase 1 Prompt 8: hard cap on characters sent to the model for conversation context */
const MAX_MEMORY_CHARS = 2500;

export function createEmptyMemory(): ConversationMemory {
  return {
    previousQuestions: [],
    previousResponses: [],
    referencedCampaigns: [],
    referencedKeywords: [],
    turns: [],
  };
}

/** Append a turn and update aggregated lists. */
export function appendTurn(
  memory: ConversationMemory,
  question: string,
  response: string,
  extracted: { campaigns?: string[]; keywords?: string[] }
): ConversationMemory {
  const campaigns = [...memory.referencedCampaigns, ...(extracted.campaigns ?? [])]
    .filter((c, i, a) => a.indexOf(c) === i)
    .slice(-MAX_REFERENCED);
  const keywords = [...memory.referencedKeywords, ...(extracted.keywords ?? [])]
    .filter((k, i, a) => a.indexOf(k) === i)
    .slice(-MAX_REFERENCED);
  const turn: ConversationTurn = {
    question,
    response: response.slice(0, 2000),
    referencedCampaigns: extracted.campaigns ?? [],
    referencedKeywords: extracted.keywords ?? [],
  };
  const turns = [...memory.turns, turn].slice(-MAX_TURNS);
  return {
    previousQuestions: turns.map((t) => t.question),
    previousResponses: turns.map((t) => t.response),
    referencedCampaigns: campaigns,
    referencedKeywords: keywords,
    turns,
  };
}

/** Build a short summary string for the Gemini prompt. Truncated to MAX_MEMORY_CHARS. */
export function formatMemoryForPrompt(memory: ConversationMemory): string {
  if (memory.turns.length === 0) return '';
  const lines: string[] = ['--- Conversation context ---'];
  memory.turns.slice(-5).forEach((t) => {
    lines.push(`Q: ${t.question.slice(0, 150)}`);
    lines.push(`A: ${t.response.slice(0, 200)}...`);
  });
  if (memory.referencedCampaigns.length > 0) {
    lines.push(`Recently referenced campaigns: ${memory.referencedCampaigns.slice(-10).join(', ')}`);
  }
  if (memory.referencedKeywords.length > 0) {
    lines.push(`Recently referenced keywords: ${memory.referencedKeywords.slice(-10).join(', ')}`);
  }
  const out = lines.join('\n');
  return out.length > MAX_MEMORY_CHARS ? out.slice(0, MAX_MEMORY_CHARS - 20) + '\n...[truncated]' : out;
}
