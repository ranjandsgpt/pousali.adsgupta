import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { fingerprintHash, signals } = body as {
    fingerprintHash: string;
    signals: {
      localStorageId: string;
      screenRes: string;
      timezone: string;
      platform: string;
      language: string;
    };
  };

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  const userAgent = req.headers.get('user-agent') ?? '';

  if (!supabase) {
    return NextResponse.json({
      userId: `temp_${fingerprintHash.slice(0, 8)}`,
      isTemp: true,
    });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          fingerprint_hash: fingerprintHash,
          local_storage_id: signals.localStorageId,
          ip_address: ip,
          user_agent: userAgent,
          screen_resolution: signals.screenRes,
          timezone: signals.timezone,
          platform: signals.platform,
          language: signals.language,
          last_seen_at: new Date().toISOString(),
        },
        {
          onConflict: 'fingerprint_hash',
          ignoreDuplicates: false,
        }
      )
      .select('user_id')
      .single();

    if (error || !data) {
      // eslint-disable-next-line no-console
      console.error('[Identify] Supabase error:', error);
      return NextResponse.json({
        userId: `temp_${fingerprintHash.slice(0, 8)}`,
        isTemp: true,
      });
    }

    return NextResponse.json({
      userId: data.user_id,
      isTemp: false,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Identify] Unexpected error:', e);
    return NextResponse.json({
      userId: `temp_${fingerprintHash.slice(0, 8)}`,
      isTemp: true,
    });
  }
}

