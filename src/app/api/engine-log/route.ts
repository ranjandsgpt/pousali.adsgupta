import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { sessionId, userId, logs } = (await req.json()) as {
    sessionId: string;
    userId: string;
    logs: Array<{
      taskType: string;
      modelUsed: string;
      fallbackUsed: boolean;
      confidence: number;
      warnings: string[];
      durationMs: number;
    }>;
  };

  if (!logs?.length) {
    return NextResponse.json({ ok: true });
  }

  const rows = logs.map((log) => ({
    session_id: sessionId,
    user_id: userId,
    task_type: log.taskType,
    model_used: log.modelUsed,
    fallback_used: log.fallbackUsed,
    confidence: log.confidence,
    warnings: log.warnings,
    duration_ms: log.durationMs,
  }));

  try {
    if (!supabase) {
      return NextResponse.json({ ok: true });
    }
    const { error } = await supabase.from('engine_logs').insert(rows);
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[EngineLog] Insert error:', error);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[EngineLog] Unexpected insert error:', e);
  }

  return NextResponse.json({ ok: true });
}

