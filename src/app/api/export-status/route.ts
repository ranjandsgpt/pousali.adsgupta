/**
 * Phase 40 & 6 — Export progress API.
 * Returns: idle | queued | rendering | verifying | retrying | ready | error.
 */

import { NextResponse } from 'next/server';
import { getExportStatus, EXPORT_STATUS_MESSAGES } from '@/services/exportStatusStore';

export async function GET() {
  const { status, message } = getExportStatus();
  const defaultMsg = EXPORT_STATUS_MESSAGES[status as keyof typeof EXPORT_STATUS_MESSAGES] ?? status;
  return NextResponse.json({
    status,
    message: message || defaultMsg,
  });
}
