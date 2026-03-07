/**
 * Log Gemini responses to logs/gemini-responses/ for debugging.
 * Server-side only (used by API routes).
 */

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const LOG_DIR = 'logs/gemini-responses';

export type GeminiLogMode = 'verify_slm' | 'insight_narrative' | 'presentation' | 'structured' | 'schema_infer';

export interface GeminiLogEntry {
  mode: GeminiLogMode;
  requestId?: string;
  /** Raw response from Gemini (before validation). */
  rawResponse: string;
  /** Parsed or validated result summary (e.g. "plain_text" | "json" | "invalid"). */
  outcome: string;
  /** Optional error or validation message. */
  error?: string;
  timestamp: string;
}

function getLogDir(): string {
  const base = typeof process !== 'undefined' && process.cwd ? process.cwd() : '.';
  return path.join(base, LOG_DIR);
}

/**
 * Append a single Gemini response to a timestamped log file.
 * Creates logs/gemini-responses if it does not exist.
 */
export async function logGeminiResponse(entry: Omit<GeminiLogEntry, 'timestamp'>): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const full: GeminiLogEntry = { ...entry, timestamp };
  const dir = getLogDir();
  try {
    await mkdir(dir, { recursive: true });
    const filename = path.join(dir, `gemini-${entry.mode}-${timestamp.slice(0, 19)}.json`);
    await writeFile(filename, JSON.stringify(full, null, 2), 'utf-8');
  } catch (e) {
    console.error('[geminiResponseLogger]', e);
  }
}
