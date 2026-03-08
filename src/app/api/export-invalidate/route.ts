/**
 * Phase 39 — Invalidate export cache (on new audit run or refresh clicked).
 */

import { NextResponse } from 'next/server';
import { invalidateCache } from '@/services/exportCache';
import { setExportStatus } from '@/services/exportStatusStore';

export async function POST() {
  await invalidateCache();
  setExportStatus('idle', '');
  return NextResponse.json({ ok: true });
}
