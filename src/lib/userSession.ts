import { v4 as uuidv4 } from 'uuid';
import type { AggregatedMetrics } from './aggregateReports';
import { getFingerprint } from './fingerprint';
import { engineLogBuffer } from './tripleEngine';

const SESSION_KEY = 'audit_session_id';
const USER_ID_KEY = 'audit_user_id';

export interface UserSessionState {
  userId: string;
  sessionId: string;
  isTemp: boolean;
}

function getOrCreateSessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = uuidv4();
    window.sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return uuidv4();
  }
}

function writeSessionToUrl(sessionId: string) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('session', sessionId);
    window.history.replaceState({}, '', url.toString());
  } catch {
    // ignore
  }
}

export async function initUserSession(): Promise<UserSessionState> {
  const sessionId = getOrCreateSessionId();
  writeSessionToUrl(sessionId);

  const { hash, signals } = await getFingerprint();

  let userId: string;
  let isTemp = false;

  try {
    const res = await fetch('/api/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fingerprintHash: hash, signals }),
    });
    const data = (await res.json()) as { userId: string; isTemp?: boolean };
    userId = data.userId;
    isTemp = data.isTemp ?? false;
    if (!isTemp) {
      window.localStorage.setItem(USER_ID_KEY, userId);
    }
  } catch {
    userId =
      window.localStorage.getItem(USER_ID_KEY) ?? `temp_${hash.slice(0, 8)}`;
    isTemp = true;
  }

  try {
    await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userId,
        reportTypes: [],
        currency: '£',
      }),
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[UserSession] Session creation failed:', e);
  }

  return { userId, sessionId, isTemp };
}

export async function saveAuditResult(
  sessionId: string,
  userId: string,
  metrics: AggregatedMetrics
): Promise<void> {
  try {
    await fetch('/api/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userId,
        metrics: {
          accountName: undefined,
          currency: metrics.currency,
          healthScore: undefined,
          acos: metrics.acos,
          roas: metrics.roas,
          tacos: metrics.tacos,
          adSpend: metrics.adSpend,
          adSales: metrics.adSales,
          totalStoreSales: metrics.totalStoreSales,
          organicSales: metrics.organicSales,
          sessions: metrics.sessions,
          clicks: metrics.adClicks,
          orders: metrics.adOrders,
          cpc: metrics.cpc,
          buyBoxPct: metrics.buyBoxPct,
          campaignCount: undefined,
          wasteSpend: undefined,
          wasteTermCount: undefined,
          confidenceScore: undefined,
          invariantPassed: undefined,
        },
      }),
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[UserSession] Save failed:', e);
  }

  const logs = [...engineLogBuffer];
  if (logs.length > 0) {
    try {
      await fetch('/api/engine-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId, logs }),
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[UserSession] Log save failed:', e);
    }
  }
  engineLogBuffer.length = 0;
}

