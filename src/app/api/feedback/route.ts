import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST: Submit product feedback from the audit dashboard widget.
 * Body: { sessionId?, userId?, section, type, description?, includeSession?, metricsSnapshot?, pageUrl? }
 * Always returns { ok: true }.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      sessionId,
      userId,
      section = 'general',
      type = 'feedback',
      description = '',
      includeSession = false,
      metricsSnapshot,
      pageUrl,
    } = body;

    if (supabase) {
      await supabase.from('feedback').insert({
        session_id: sessionId ? String(sessionId) : null,
        user_id: userId || null,
        section: String(section),
        type: String(type),
        description: description ? String(description).slice(0, 500) : null,
        include_session: Boolean(includeSession),
        metrics_snapshot: metricsSnapshot ?? null,
        page_url: pageUrl ? String(pageUrl).slice(0, 1024) : null,
      });
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[feedback] POST error:', e);
  }
  return NextResponse.json({ ok: true });
}
