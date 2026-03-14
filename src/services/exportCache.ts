/**
 * Phase 39 — Asset cache activation.
 * Phase: Export asset versioning — audit_1_v1.pptx, audit_1_v2.pptx for export history.
 * Phase 1 Prompt 7: Persistent cache via Supabase Storage when configured.
 */

import { writeFile, readFile, mkdir, readdir, unlink } from 'fs/promises';
import path from 'path';
import { writeCacheSupabase, readCacheSupabase, invalidateCacheSupabase } from './supabaseExportCache';

const META_FILE = 'cache-meta.json';

/** Serverless (e.g. Vercel): /var/task is read-only; use /tmp. Local: project/export-cache. */
export function getCacheDir(): string {
  if (typeof process !== 'undefined' && process.env.VERCEL) {
    return '/tmp/export-cache';
  }
  const base = typeof process !== 'undefined' && process.cwd ? process.cwd() : '.';
  return path.join(base, 'export-cache');
}

export interface CacheMeta {
  auditId: string;
  timestamp: string;
  hasPptx: boolean;
  hasPdf: boolean;
  /** Version for this auditId (incremented on each write) */
  version?: number;
  pptxPath?: string;
  pdfPath?: string;
}

export async function writeCache(
  auditId: string,
  pptxBuffer: Buffer | Uint8Array | null,
  pdfBuffer: Buffer | Uint8Array | null
): Promise<void> {
  const dir = getCacheDir();
  await mkdir(dir, { recursive: true });

  let version = 1;
  try {
    const metaRaw = await readFile(path.join(dir, META_FILE), 'utf-8');
    const existing = JSON.parse(metaRaw) as CacheMeta;
    if (existing.auditId === auditId && typeof existing.version === 'number') {
      version = existing.version + 1;
    }
  } catch {
    //
  }

  const safeId = auditId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const pptxPath = pptxBuffer ? path.join(dir, `${safeId}_v${version}.pptx`) : undefined;
  const pdfPath = pdfBuffer ? path.join(dir, `${safeId}_v${version}.pdf`) : undefined;

  if (pptxBuffer && pptxPath) {
    await writeFile(pptxPath, Buffer.from(pptxBuffer));
  }
  if (pdfBuffer && pdfPath) {
    await writeFile(pdfPath, Buffer.from(pdfBuffer));
  }

  const meta: CacheMeta = {
    auditId,
    timestamp: new Date().toISOString(),
    hasPptx: Boolean(pptxBuffer?.byteLength),
    hasPdf: Boolean(pdfBuffer?.byteLength),
    version,
    pptxPath,
    pdfPath,
  };
  await writeFile(path.join(dir, META_FILE), JSON.stringify(meta, null, 2));

  // Keep latest.pptx / latest.pdf for backward compatibility (point to current)
  if (pptxBuffer) {
    await writeFile(path.join(dir, 'latest.pptx'), Buffer.from(pptxBuffer));
  }
  if (pdfBuffer) {
    await writeFile(path.join(dir, 'latest.pdf'), Buffer.from(pdfBuffer));
  }

  await writeCacheSupabase(auditId, meta, pptxBuffer, pdfBuffer);
}

export async function readCache(): Promise<{
  meta: CacheMeta | null;
  pptx: Buffer | null;
  pdf: Buffer | null;
}> {
  const fromSupabase = await readCacheSupabase();
  if (fromSupabase.meta && (fromSupabase.pptx != null || fromSupabase.pdf != null)) {
    return fromSupabase;
  }
  const dir = getCacheDir();
  let meta: CacheMeta | null = null;
  try {
    const metaRaw = await readFile(path.join(dir, META_FILE), 'utf-8');
    meta = JSON.parse(metaRaw) as CacheMeta;
  } catch {
    return { meta: null, pptx: null, pdf: null };
  }
  let pptx: Buffer | null = null;
  let pdf: Buffer | null = null;
  try {
    if (meta.hasPptx) {
      pptx = await readFile(meta.pptxPath ?? path.join(dir, 'latest.pptx'));
    }
  } catch {
    try {
      pptx = await readFile(path.join(dir, 'latest.pptx'));
    } catch {
      //
    }
  }
  try {
    if (meta.hasPdf) {
      pdf = await readFile(meta.pdfPath ?? path.join(dir, 'latest.pdf'));
    }
  } catch {
    try {
      pdf = await readFile(path.join(dir, 'latest.pdf'));
    } catch {
      //
    }
  }
  return { meta, pptx, pdf };
}

export async function invalidateCache(): Promise<void> {
  await invalidateCacheSupabase();
  const dir = getCacheDir();
  try {
    const files = await readdir(dir);
    for (const f of files) {
      if (f.endsWith('.pptx') || f.endsWith('.pdf') || f === META_FILE) {
        await unlink(path.join(dir, f));
      }
    }
  } catch {
    //
  }
}
