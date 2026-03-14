/**
 * Phase 1 Prompt 7 — Persistent export cache via Supabase Storage.
 * When SUPABASE_URL is set, export assets are also stored in Storage for persistence across serverless runs.
 */

import { supabase } from '@/lib/supabase';
import type { CacheMeta } from './exportCache';

const BUCKET = 'export-cache';

function safeAuditPath(auditId: string): string {
  return auditId.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export async function writeCacheSupabase(
  auditId: string,
  meta: CacheMeta,
  pptxBuffer: Buffer | Uint8Array | null,
  pdfBuffer: Buffer | Uint8Array | null
): Promise<void> {
  if (!supabase) return;
  const prefixes = [`exports/${safeAuditPath(auditId)}`, 'exports/latest'];
  for (const prefix of prefixes) {
    try {
      await supabase.storage.from(BUCKET).upload(`${prefix}/meta.json`, JSON.stringify(meta), {
        contentType: 'application/json',
        upsert: true,
      });
      if (pptxBuffer && pptxBuffer.byteLength > 0) {
        await supabase.storage.from(BUCKET).upload(`${prefix}/latest.pptx`, pptxBuffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          upsert: true,
        });
      }
      if (pdfBuffer && pdfBuffer.byteLength > 0) {
        await supabase.storage.from(BUCKET).upload(`${prefix}/latest.pdf`, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });
      }
    } catch (e) {
      console.warn('[Supabase export cache] write failed', e);
    }
  }
}

/** Read from Supabase. If auditId is omitted, reads the "latest" export (last written). */
export async function readCacheSupabase(auditId?: string): Promise<{
  meta: CacheMeta | null;
  pptx: Buffer | null;
  pdf: Buffer | null;
}> {
  if (!supabase) return { meta: null, pptx: null, pdf: null };
  const prefix = auditId ? `exports/${safeAuditPath(auditId)}` : 'exports/latest';
  try {
    const { data: metaData, error: metaError } = await supabase.storage
      .from(BUCKET)
      .download(`${prefix}/meta.json`);
    if (metaError || !metaData) return { meta: null, pptx: null, pdf: null };
    const meta = JSON.parse(await metaData.text()) as CacheMeta;

    let pptx: Buffer | null = null;
    let pdf: Buffer | null = null;
    if (meta.hasPptx) {
      const { data: pptxData } = await supabase.storage.from(BUCKET).download(`${prefix}/latest.pptx`);
      if (pptxData) pptx = Buffer.from(await pptxData.arrayBuffer());
    }
    if (meta.hasPdf) {
      const { data: pdfData } = await supabase.storage.from(BUCKET).download(`${prefix}/latest.pdf`);
      if (pdfData) pdf = Buffer.from(await pdfData.arrayBuffer());
    }
    return { meta, pptx, pdf };
  } catch {
    return { meta: null, pptx: null, pdf: null };
  }
}

/** List audit IDs that have cache entries (for invalidation by prefix). */
export async function listCachePrefixesSupabase(): Promise<string[]> {
  if (!supabase) return [];
  try {
    const { data: list } = await supabase.storage.from(BUCKET).list('exports');
    return (list ?? []).map((f) => f.name).filter(Boolean);
  } catch {
    return [];
  }
}

export async function invalidateCacheSupabase(): Promise<void> {
  if (!supabase) return;
  try {
    const prefixes = await listCachePrefixesSupabase();
    for (const p of prefixes) {
      const { data: files } = await supabase.storage.from(BUCKET).list(`exports/${p}`);
      const paths = (files ?? []).map((f) => `exports/${p}/${f.name}`);
      if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths);
    }
  } catch (e) {
    console.warn('[Supabase export cache] invalidate failed', e);
  }
}
