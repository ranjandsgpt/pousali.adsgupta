export interface FingerprintSignals {
  localStorageId: string;
  screenRes: string;
  timezone: string;
  platform: string;
  language: string;
  colorDepth: number;
  hardwareConcurrency: number;
  deviceMemory: number;
  canvasHash: string;
}

export interface FingerprintResult {
  hash: string;
  signals: FingerprintSignals;
}

const LS_KEY = 'audit_uid';

function getOrCreateLocalStorageId(): string {
  try {
    const existing = localStorage.getItem(LS_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    localStorage.setItem(LS_KEY, id);
    return id;
  } catch {
    return 'ls_unavailable';
  }
}

function getCanvasHash(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no_canvas';
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Amazon Audit 🔍', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Amazon Audit 🔍', 4, 17);
    return canvas
      .toDataURL()
      .split('')
      .reduce((hash, char) => {
        const h = (hash << 5) - hash + char.charCodeAt(0);
        // eslint-disable-next-line no-bitwise
        return h & h;
      }, 0)
      .toString(36);
  } catch {
    return 'canvas_blocked';
  }
}

async function sha256(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function getFingerprint(): Promise<FingerprintResult> {
  const nav = navigator as any;

  const signals: FingerprintSignals = {
    localStorageId: getOrCreateLocalStorageId(),
    screenRes: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    platform: navigator.platform,
    language: navigator.language,
    colorDepth: window.screen.colorDepth,
    hardwareConcurrency: navigator.hardwareConcurrency ?? 0,
    deviceMemory: nav.deviceMemory ?? 0,
    canvasHash: getCanvasHash(),
  };

  const signalString = [
    signals.localStorageId,
    signals.screenRes,
    signals.timezone,
    signals.platform,
    signals.language,
    signals.colorDepth,
    signals.hardwareConcurrency,
    signals.deviceMemory,
    signals.canvasHash,
  ].join('|');

  const hash = await sha256(signalString);

  return { hash, signals };
}

