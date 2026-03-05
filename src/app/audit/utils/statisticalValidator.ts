/**
 * Statistical validation layer for Amazon PPC metrics.
 * Flags anomalies from corrupted or implausible report values.
 */

export interface StatisticalValidationResult {
  passed: boolean;
  anomalies: { metric: string; value: number; reason: string }[];
}

const ANOMALY_ACOS_MAX = 500; // ACOS > 500% → anomaly
const ANOMALY_ROAS_MIN = 0.2; // ROAS < 0.2 → anomaly
const ANOMALY_CVR_MAX_PCT = 80; // CVR > 80% → anomaly
const ANOMALY_CPC_MAX = 50; // CPC > $50 → anomaly
const ANOMALY_CTR_MAX_PCT = 50; // CTR > 50% → anomaly

export function validateMetrics(opts: {
  acos?: number;
  roas?: number;
  cvrPct?: number;
  cpc?: number;
  ctrPct?: number;
}): StatisticalValidationResult {
  const anomalies: { metric: string; value: number; reason: string }[] = [];

  if (opts.acos != null && Number.isFinite(opts.acos) && opts.acos > ANOMALY_ACOS_MAX) {
    anomalies.push({ metric: 'ACOS', value: opts.acos, reason: `ACOS > ${ANOMALY_ACOS_MAX}% is implausible` });
  }
  if (opts.roas != null && Number.isFinite(opts.roas) && opts.roas < ANOMALY_ROAS_MIN && opts.roas >= 0) {
    anomalies.push({ metric: 'ROAS', value: opts.roas, reason: `ROAS < ${ANOMALY_ROAS_MIN} may indicate data error` });
  }
  if (opts.cvrPct != null && Number.isFinite(opts.cvrPct) && opts.cvrPct > ANOMALY_CVR_MAX_PCT) {
    anomalies.push({ metric: 'CVR', value: opts.cvrPct, reason: `CVR > ${ANOMALY_CVR_MAX_PCT}% is anomalous` });
  }
  if (opts.cpc != null && Number.isFinite(opts.cpc) && opts.cpc > ANOMALY_CPC_MAX) {
    anomalies.push({ metric: 'CPC', value: opts.cpc, reason: `CPC > $${ANOMALY_CPC_MAX} is anomalous` });
  }
  if (opts.ctrPct != null && Number.isFinite(opts.ctrPct) && opts.ctrPct > ANOMALY_CTR_MAX_PCT) {
    anomalies.push({ metric: 'CTR', value: opts.ctrPct, reason: `CTR > ${ANOMALY_CTR_MAX_PCT}% is anomalous` });
  }

  return {
    passed: anomalies.length === 0,
    anomalies,
  };
}
