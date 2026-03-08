/**
 * Export Worker — run heavy export generation asynchronously to avoid blocking UI (Phase 16).
 * Invoked by the API route; the API can run the pipeline in a non-blocking way or queue.
 */

import type { ExportPipelineInput, ExportPipelineResult } from '@/services/exportPipeline';
import { runExportPipeline } from '@/services/exportPipeline';

/**
 * Run the export pipeline (sync models, build PremiumState, run judge).
 * Call from API route; for true background processing, wrap in setImmediate or a job queue.
 */
export async function runExportWorker(input: ExportPipelineInput): Promise<ExportPipelineResult> {
  return runExportPipeline(input);
}
