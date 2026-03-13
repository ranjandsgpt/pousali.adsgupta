/**
 * Runtime config store (localStorage). Agents and components read defaults from here.
 */

const DEFAULTS = {
  insightOrder: ['waste', 'acos', 'roas', 'tacos', 'brand', 'targeting'],
  kpiSectionExpanded: true,
  highlightThreshold: { acos: 0.4, waste: 100, roas: 2.0 },
  exportPageOrder: ['summary', 'financials', 'waste', 'asins', 'opportunities'],
  narrativeTone: 'diagnostic' as 'momentum' | 'diagnostic' | 'rescue',
  copilotAutoSuggest: true,
  showOrganicBreakdown: true,
};

export const ConfigStore = {
  defaults: DEFAULTS,
  get<K extends keyof typeof DEFAULTS>(key: K): (typeof DEFAULTS)[K] {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(`audit_config_${key}`) : null;
      return stored ? (JSON.parse(stored) as (typeof DEFAULTS)[K]) : DEFAULTS[key];
    } catch {
      return DEFAULTS[key];
    }
  },
  set<K extends keyof typeof DEFAULTS>(key: K, value: (typeof DEFAULTS)[K]): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`audit_config_${key}`, JSON.stringify(value));
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[ConfigStore] Could not persist config:', e);
    }
  },
  reset(): void {
    if (typeof window === 'undefined') return;
    (Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[]).forEach((k) => {
      localStorage.removeItem(`audit_config_${k}`);
    });
  },
};

export type ConfigStoreDefaults = typeof DEFAULTS;
