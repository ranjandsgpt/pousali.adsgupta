/**
 * Phase 40 — Export progress API.
 * Returns: idle | queued | rendering | verifying | ready | error.
 */

import { NextResponse } from 'next/server';
import { getExportStatus } from '@/services/exportStatusStore';

export async function GET() {
  const { status, message } = getExportStatus();
  return NextResponse.json({
    status,
    message: message || (status === 'ready' ? 'Export ready' : status === 'rendering' ? 'Generating charts…' : status),
  });
}
