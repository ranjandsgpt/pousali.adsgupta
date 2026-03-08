/**
 * Central feedback store for Copilot, KPI metrics, insights, tables, charts.
 * Schema: audit_id, artifact_type, artifact_id, value, feedback, feedbackType, comment, timestamp, sessionId.
 * Used by CentralFeedbackAgent and HumanFeedbackAgent for learning loop.
 */

export type FeedbackVerdict = 'correct' | 'incorrect';

export type FeedbackType = 'like' | 'dislike' | 'correction';

export type AuditFeedbackArtifactType =
  | 'metrics'
  | 'tables'
  | 'charts'
  | 'insights'
  | 'recommendations'
  | 'copilot_response';

/** audit_feedback table row (in-memory representation). */
export interface AuditFeedbackRecord {
  audit_id: string;
  artifact_type: AuditFeedbackArtifactType;
  artifact_id: string;
  value: string | number;
  feedback: FeedbackVerdict;
  feedbackType?: FeedbackType;
  comment?: string;
  timestamp: string; // ISO
  sessionId?: string;
}

/** Legacy shape for Phase 1 (metricId, userFeedback); mapped to AuditFeedbackRecord internally. */
export interface MetricFeedbackRecord {
  metricId: string;
  value: string | number;
  userFeedback: FeedbackVerdict;
  comment?: string;
  timestamp: string;
  artifactType?: AuditFeedbackArtifactType;
}

const inMemoryStore: AuditFeedbackRecord[] = [];
const DEFAULT_AUDIT_ID = 'session';

function toFeedbackVerdict(feedbackType?: string, feedback?: FeedbackVerdict): FeedbackVerdict {
  if (feedback === 'correct' || feedback === 'incorrect') return feedback;
  if (feedbackType === 'like') return 'correct';
  if (feedbackType === 'dislike' || feedbackType === 'correction') return 'incorrect';
  return 'correct';
}

function toAuditRecord(
  input: Omit<MetricFeedbackRecord, 'timestamp'> | Omit<AuditFeedbackRecord, 'timestamp'> | (Omit<AuditFeedbackRecord, 'timestamp'> & { feedbackType?: FeedbackType }),
  timestamp: string
): AuditFeedbackRecord {
  if ('artifact_id' in input && ('feedback' in input || 'feedbackType' in input) && 'audit_id' in input) {
    const feedback = toFeedbackVerdict((input as { feedbackType?: string }).feedbackType, (input as { feedback?: FeedbackVerdict }).feedback);
    return {
      audit_id: (input as AuditFeedbackRecord).audit_id,
      artifact_type: (input as AuditFeedbackRecord).artifact_type,
      artifact_id: (input as AuditFeedbackRecord).artifact_id,
      value: (input as AuditFeedbackRecord).value,
      feedback,
      feedbackType: (input as { feedbackType?: FeedbackType }).feedbackType,
      comment: (input as AuditFeedbackRecord).comment,
      timestamp,
      sessionId: (input as { sessionId?: string }).sessionId,
    };
  }
  const r = input as Omit<MetricFeedbackRecord, 'timestamp'> & { feedbackType?: string };
  const feedback = toFeedbackVerdict(r.feedbackType, r.userFeedback);
  return {
    audit_id: DEFAULT_AUDIT_ID,
    artifact_type: r.artifactType ?? 'metrics',
    artifact_id: r.metricId,
    value: r.value,
    feedback,
    comment: r.comment,
    timestamp,
  };
}

export function addFeedback(
  record: Omit<MetricFeedbackRecord, 'timestamp'> | (Omit<AuditFeedbackRecord, 'timestamp'> & { audit_id: string })
): AuditFeedbackRecord {
  const timestamp = new Date().toISOString();
  const full = toAuditRecord(record, timestamp);
  inMemoryStore.push(full);
  return full;
}

export function getFeedback(): AuditFeedbackRecord[] {
  return [...inMemoryStore];
}

/** Get only incorrect feedback for learning/reverification. */
export function getIncorrectFeedback(): AuditFeedbackRecord[] {
  return inMemoryStore.filter((r) => r.feedback === 'incorrect');
}

export function clearFeedback(): void {
  inMemoryStore.length = 0;
}
