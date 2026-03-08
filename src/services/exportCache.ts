/**
 * Phase 39 — Asset cache activation.
 * Store: pptx buffer, pdf buffer, timestamp, auditId in export-cache/.
 * Invalidate when: new audit run, refresh clicked.
 */

import { writeFile, readFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

const CACHE_DIR = 'export-cache';
const META_FILE = 'cache-meta.json';

export interface CacheMeta {
  auditId: string;
  timestamp: string;
  hasPptx: boolean;
  hasPdf: boolean;
}

function getCacheDir(): string {
  const base = typeof process !== 'undefined' && process.cwd ? process.cwd() : '.';
  return path.join(base, CACHE_DIR);
}

export async function writeCache(
  auditId: string,
  pptxBuffer: Buffer | Uint8Array | null,
  pdfBuffer: Buffer | Uint8Array | null
): Promise<void> {
  const dir = getCacheDir();
  await mkdir(dir, { recursive: true });
  const meta: CacheMeta = {
    auditId,
    timestamp: new Date().toISOString(),
    hasPptx: Boolean(pptxBuffer?.byteLength),
    hasPdf: Boolean(pdfBuffer?.byteLength),
  };
  if (pptxBuffer) {
    await writeFile(path.join(dir, 'latest.pptx'), Buffer.from(pptxBuffer));
  }
  if (pdfBuffer) {
    await writeFile(path.join(dir, 'latest.pdf'), Buffer.from(pdfBuffer));
  }
  await writeFile(path.join(dir, META_FILE), JSON.stringify(meta, null, 2));
}

export async function readCache(): Promise<{
  meta: CacheMeta | null;
  pptx: Buffer | null;
  pdf: Buffer | null;
}> {
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
    if (meta.hasPptx) pptx = await readFile(path.join(dir, 'latest.pptx'));
  } catch {
    //
  }
  try {
    if (meta.hasPdf) pdf = await readFile(path.join(dir, 'latest.pdf'));
  } catch {
    //
  }
  return { meta, pptx, pdf };
}

export async function invalidateCache(): Promise<void> {
  const dir = getCacheDir();
  try {
    await unlink(path.join(dir, 'latest.pptx'));
  } catch {
    //
  }
  try {
    await unlink(path.join(dir, 'latest.pdf'));
  } catch {
    //
  }
  try {
    await unlink(path.join(dir, META_FILE));
  } catch {
    //
  }
}
