import { NextRequest, NextResponse } from 'next/server';
import { addFeedback, getFeedback } from '@/app/audit/db/feedback';

/**
 * POST: submit feedback (like/dislike or correct/incorrect).
 * Body: { artifactType, artifactId | artifact_id | metricId, value?, feedbackType: 'like'|'dislike' | feedback: 'correct'|'incorrect', comment?, audit_id?, sessionId? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const artifactId = body.artifactId ?? body.artifact_id ?? body.metricId;
    const feedbackType = body.feedbackType as string | undefined;
    const userFeedback = body.feedback ?? body.userFeedback;
    const { value, comment, artifactType, audit_id, sessionId } = body;
    const hasVerdict = userFeedback && ['correct', 'incorrect'].includes(userFeedback);
    const hasLikeDislike = feedbackType && ['like', 'dislike'].includes(feedbackType);
    if (!artifactId || (!hasVerdict && !hasLikeDislike)) {
      return NextResponse.json(
        { error: 'Missing artifactId/artifact_id/metricId and feedback (correct|incorrect) or feedbackType (like|dislike)' },
        { status: 400 }
      );
    }
    const type = (artifactType ? String(artifactType) : 'metrics') as
      | 'metrics'
      | 'tables'
      | 'charts'
      | 'insights'
      | 'recommendations'
      | 'copilot_response';
    const record = addFeedback({
      audit_id: audit_id ?? 'session',
      artifact_type: type,
      artifact_id: String(artifactId),
      value: value ?? '',
      feedback: hasVerdict ? userFeedback : feedbackType === 'like' ? 'correct' : 'incorrect',
      feedbackType: hasLikeDislike ? (feedbackType as 'like' | 'dislike') : undefined,
      comment: comment ? String(comment) : undefined,
      sessionId: sessionId ? String(sessionId) : undefined,
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
