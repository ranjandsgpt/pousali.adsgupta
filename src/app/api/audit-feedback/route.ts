import { NextRequest, NextResponse } from 'next/server';
import { addFeedback, getFeedback } from '@/app/audit/db/feedback';

/**
 * POST: submit metric/artifact feedback (Correct / Incorrect).
 * Body: { metricId | artifact_id, value, userFeedback | feedback: 'correct'|'incorrect', comment?, artifactType?, audit_id? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const artifactId = body.artifact_id ?? body.metricId;
    const userFeedback = body.feedback ?? body.userFeedback;
    const { value, comment, artifactType, audit_id } = body;
    if (!artifactId || !userFeedback || !['correct', 'incorrect'].includes(userFeedback)) {
      return NextResponse.json(
        { error: 'Missing or invalid metricId/artifact_id, userFeedback/feedback (must be correct|incorrect)' },
        { status: 400 }
      );
    }
    const type = artifactType ? String(artifactType) as 'metrics' | 'tables' | 'charts' | 'insights' | 'recommendations' : 'metrics';
    const record = addFeedback({
      metricId: String(artifactId),
      value: value ?? '',
      userFeedback,
      comment: comment ? String(comment) : undefined,
      artifactType: type,
    });
    return NextResponse.json({ ok: true, id: record.timestamp });
  } catch (e) {
    console.error('audit-feedback POST', e);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

/**
 * GET: return collected feedback (for learning agent / reverification).
 */
export async function GET() {
  const list = getFeedback();
  return NextResponse.json({ feedback: list });
}
