/**
 * Phase 7 — Check if python3 is available before running Python renderer.
 */

import { spawn } from 'child_process';

let cached: boolean | null = null;

export function checkPythonAvailable(): Promise<boolean> {
  if (cached !== null) return Promise.resolve(cached);
  return new Promise((resolve) => {
    const proc = spawn('python3', ['--version'], { stdio: ['ignore', 'pipe', 'pipe'] });
    let resolved = false;
    const done = (ok: boolean) => {
      if (!resolved) {
        resolved = true;
        cached = ok;
        resolve(ok);
      }
    };
    proc.on('error', () => done(false));
    proc.on('close', (code) => done(code === 0));
    proc.stdout?.on('data', () => {});
    proc.stderr?.on('data', () => {});
    setTimeout(() => done(false), 3000);
  });
}

export function clearPythonAvailabilityCache(): void {
  cached = null;
}
