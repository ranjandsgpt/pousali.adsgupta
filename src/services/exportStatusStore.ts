/**
 * Phase 40 & 6 — Export progress state for UI.
 * States: queued | rendering | verifying | retrying | ready | error.
 */

export type ExportStatus = 'idle' | 'queued' | 'rendering' | 'verifying' | 'retrying' | 'ready' | 'error';

export const EXPORT_STATUS_MESSAGES: Record<ExportStatus, string> = {
  idle: '',
  queued: 'Preparing export…',
  rendering: 'Generating charts…',
  verifying: 'Validating CXO standards…',
  retrying: 'Retrying export…',
  ready: 'Export ready',
  error: 'Export failed',
};

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
