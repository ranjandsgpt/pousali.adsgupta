/**
 * Phase 1 & 2: Feedback capture. Schema: audit_id, artifact_type, artifact_id, value, feedback, comment, timestamp.
 */

export type FeedbackVerdict = 'correct' | 'incorrect';

export type AuditFeedbackArtifactType = 'metrics' | 'tables' | 'charts' | 'insights' | 'recommendations';

/** audit_feedback table row (in-memory representation). */
export interface AuditFeedbackRecord {
  audit_id: string;
  artifact_type: AuditFeedbackArtifactType;
  artifact_id: string;
  value: string | number;
  feedback: FeedbackVerdict;
  comment?: string;
  timestamp: string; // ISO
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

function toAuditRecord(
  input: Omit<MetricFeedbackRecord, 'timestamp'> | Omit<AuditFeedbackRecord, 'timestamp'>,
  timestamp: string
): AuditFeedbackRecord {
  if ('artifact_id' in input && 'feedback' in input && 'audit_id' in input) {
    return {
      audit_id: input.audit_id,
      artifact_type: input.artifact_type,
      artifact_id: input.artifact_id,
      value: input.value,
      feedback: input.feedback,
      comment: input.comment,
      timestamp,
    };
  }
  const r = input as Omit<MetricFeedbackRecord, 'timestamp'>;
  return {
    audit_id: DEFAULT_AUDIT_ID,
    artifact_type: r.artifactType ?? 'metrics',
    artifact_id: r.metricId,
    value: r.value,
    feedback: r.userFeedback,
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
