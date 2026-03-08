/**
 * Log Gemini request metadata: prompt length, context size, latency, validation result.
 * Server-side only. Writes to logs/gemini-requests/
 */

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const LOG_DIR = 'logs/gemini-requests';

export type GeminiRequestMode = 'copilot' | 'insight_narrative' | 'presentation' | 'structured' | 'verify_slm' | 'schema_infer';

export interface GeminiRequestLogEntry {
  mode: GeminiRequestMode;
  timestamp: string;
  /** Character length of the user prompt / context. */
  promptLength: number;
  /** Character length of context (auditContext.summary or equivalent). */
  contextSize: number;
  /** Response latency in milliseconds. */
  responseLatencyMs?: number;
  /** Validation result: ok | empty | invalid | error. */
  validationResult?: string;
  /** Short error message if any. */
  error?: string;
}

function getLogDir(): string {
  const base = typeof process !== 'undefined' && process.cwd ? process.cwd() : '.';
  return path.join(base, LOG_DIR);
}

/**
 * Log a Gemini request. Call after receiving the response to include latency and validation.
 */
export async function logGeminiRequest(entry: Omit<GeminiRequestLogEntry, 'timestamp'>): Promise<void> {
  const timestamp = new Date().toISOString();
  const full: GeminiRequestLogEntry = { ...entry, timestamp };
  const dir = getLogDir();
  try {
    await mkdir(dir, { recursive: true });
    const safe = timestamp.replace(/[:.]/g, '-').slice(0, 19);
    const filename = path.join(dir, `request-${entry.mode}-${safe}.json`);
    await writeFile(filename, JSON.stringify(full, null, 2), 'utf-8');
  } catch (e) {
    console.error('[geminiRequestLogger]', e);
  }
}
