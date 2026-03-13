/**
 * Behavioral observer: record UI events into BehaviorStore.
 * Components call recordAuditEvent(event, context?, auditProfile?).
 */

import { BehaviorStore, createSessionId, type AuditProfileBucket } from './behaviorStore';

let sessionId: string | null = null;

export function getAuditSessionId(): string {
  if (!sessionId) sessionId = createSessionId();
  return sessionId;
}

export function resetAuditSession(): void {
  sessionId = null;
}

export type AuditEventName =
  | 'insight_viewed'
  | 'insight_expanded'
  | 'insight_collapsed'
  | 'insight_thumbs_up'
  | 'insight_thumbs_down'
  | 'insight_copied'
  | 'insight_shared'
  | 'metric_tile_clicked'
  | 'metric_tile_hover_long'
  | 'metric_correction_submitted'
  | 'copilot_question_asked'
  | 'copilot_answer_liked'
  | 'copilot_answer_disliked'
  | 'copilot_followup_asked'
  | 'copilot_abandoned'
  | 'export_pdf_started'
  | 'export_pdf_completed'
  | 'export_pdf_abandoned'
  | 'export_pptx_started'
  | 'export_pptx_completed'
  | 'export_pptx_abandoned'
  | 'section_time_spent'
  | 'rerun_analysis'
  | 'frustration_detected';

export function recordAuditEvent(
  event: AuditEventName | string,
  context?: string,
  auditProfile?: AuditProfileBucket
): void {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return;
  BehaviorStore.add({
    event,
    context,
    sessionId: getAuditSessionId(),
    auditProfile,
  }).catch(() => {
    // ignore storage errors
  });
}
