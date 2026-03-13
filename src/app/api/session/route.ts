import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { sessionId, userId, reportTypes, currency } = (await req.json()) as {
    sessionId: string;
    userId: string;
    reportTypes: string[];
    currency: string;
  };

  if (!supabase) {
    return NextResponse.json({ ok: true });
  }

  try {
    const { error } = await supabase.from('sessions').insert({
      session_id: sessionId,
      user_id: userId,
      report_types_uploaded: reportTypes,
      currency,
      started_at: new Date().toISOString(),
    });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[Session] Create error:', error);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Session] Unexpected create error:', e);
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const { sessionId, userId, metrics, completedAt } = (await req.json()) as {
    sessionId: string;
    userId: string;
    completedAt?: string;
    metrics: {
      accountName?: string;
      currency?: string;
      healthScore?: number;
      acos?: number | null;
      roas?: number | null;
      tacos?: number | null;
      adSpend?: number;
      adSales?: number;
      totalStoreSales?: number;
      organicSales?: number;
      sessions?: number;
      clicks?: number;
      orders?: number;
      cpc?: number | null;
      buyBoxPct?: number | null;
      campaignCount?: number;
      wasteSpend?: number;
      wasteTermCount?: number;
      confidenceScore?: number;
      invariantPassed?: boolean;
    };
  };

  try {
    if (supabase) {
      await supabase
      .from('sessions')
      .update({
        completed_at: completedAt ?? new Date().toISOString(),
        account_name: metrics.accountName,
        currency: metrics.currency,
      })
      .eq('session_id', sessionId);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Session] Complete update error:', e);
  }

  try {
    if (!supabase) {
      return NextResponse.json({ ok: true });
    }
    const { error } = await supabase.from('audit_results').insert({
      session_id: sessionId,
      user_id: userId,
      health_score: metrics.healthScore,
      acos: metrics.acos ?? null,
      roas: metrics.roas ?? null,
      tacos: metrics.tacos ?? null,
      ad_spend: metrics.adSpend,
      ad_sales: metrics.adSales,
      total_store_sales: metrics.totalStoreSales,
      organic_sales: metrics.organicSales,
      currency: metrics.currency,
      sessions_count: metrics.sessions,
      clicks: metrics.clicks,
      orders: metrics.orders,
      cpc: metrics.cpc ?? null,
      buy_box_pct: metrics.buyBoxPct ?? null,
      campaign_count: metrics.campaignCount,
      waste_spend: metrics.wasteSpend,
      waste_term_count: metrics.wasteTermCount,
      confidence_score: metrics.confidenceScore,
      invariant_passed: metrics.invariantPassed,
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[Session] Audit result save error:', error);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Session] Unexpected audit result error:', e);
  }

  return NextResponse.json({ ok: true });
}

