import { NextRequest, NextResponse } from 'next/server';
import { addFeedback, getFeedback } from '@/app/audit/db/feedback';
import { getQueryInteraction } from '@/agents/queryInteractionStore';
import { registerFeedback } from '@/services/feedbackRegistry';

/**
 * POST: submit feedback (like/dislike or correct/incorrect).
 * Body: { artifactType, artifactId | artifact_id | metricId, value?, feedbackType: 'like'|'dislike' | feedback: 'correct'|'incorrect', comment?, audit_id?, sessionId? }
 * For copilot: send artifactId = responseId from Copilot response to link question/intent/capability.
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
    let resolvedValue = value ?? '';
    if ((type === 'copilot_response' || !artifactType) && resolvedValue === '') {
      const interaction = getQueryInteraction(String(artifactId));
      if (interaction) resolvedValue = JSON.stringify({ question: interaction.question, intent: interaction.intent, capability: interaction.capability, answer: interaction.answer });
    }
    const record = addFeedback({
      audit_id: audit_id ?? 'session',
      artifact_type: type,
      artifact_id: String(artifactId),
      value: resolvedValue,
      feedback: hasVerdict ? userFeedback : feedbackType === 'like' ? 'correct' : 'incorrect',
      feedbackType: hasLikeDislike ? (feedbackType as 'like' | 'dislike') : undefined,
      comment: comment ? String(comment) : undefined,
      sessionId: sessionId ? String(sessionId) : undefined,
    });
    registerFeedback({
      reportId: audit_id ?? 'session',
      userFeedback: feedbackType === 'like' || (hasVerdict && userFeedback === 'correct') ? 'like' : 'dislike',
      affectedSection: type,
      metricId: artifactId,
      comment: comment ? String(comment) : undefined,
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
