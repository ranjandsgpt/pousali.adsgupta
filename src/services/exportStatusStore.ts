/**
 * Phase 40 — Export progress state for UI.
 * In-memory store: queued | rendering | verifying | ready.
 */

export type ExportStatus = 'idle' | 'queued' | 'rendering' | 'verifying' | 'ready' | 'error';

let currentStatus: ExportStatus = 'idle';
let statusMessage: string = '';
let lastAuditId: string = '';

export function getExportStatus(): { status: ExportStatus; message: string } {
  return { status: currentStatus, message: statusMessage };
}

export function setExportStatus(status: ExportStatus, message = ''): void {
  currentStatus = status;
  statusMessage = message;
}

export function getLastAuditId(): string {
  return lastAuditId;
}

export function setLastAuditId(id: string): void {
  lastAuditId = id;
}
