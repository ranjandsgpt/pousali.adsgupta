import type { AggregatedMetrics } from './aggregateReports';

export interface InvariantResult {
  name: string;
  passed: boolean;
  description: string;
  severity: 'error' | 'warning';
  autoHealed: boolean;
  healNote?: string;
}

export function runInvariants(m: AggregatedMetrics): InvariantResult[] {
  const results: InvariantResult[] = [];
  const tol = 0.001; // 0.1% tolerance for floating point

  // 1. Organic identity
  const organicCheck = Math.abs(m.adSales + m.organicSales - m.totalStoreSales);
  results.push({
    name: 'organic_identity',
    passed: organicCheck / (m.totalStoreSales || 1) < tol,
    description: 'adSales + organicSales must equal totalStoreSales',
    severity: 'error',
    autoHealed: false,
  });

  // 2. Ad sales cannot exceed total sales
  results.push({
    name: 'ad_sales_ceiling',
    passed: m.adSales <= m.totalStoreSales || m.totalStoreSales === 0,
    description: 'Ad sales cannot exceed total store sales',
    severity: 'error',
    autoHealed: false,
  });

  // 3. ACOS identity
  if (m.acos !== null && m.adSales > 0) {
    const expected = m.adSpend / m.adSales;
    results.push({
      name: 'acos_identity',
      passed: Math.abs(m.acos - expected) < tol,
      description: 'ACOS must equal adSpend / adSales',
      severity: 'error',
      autoHealed: false,
    });
  }

  // 4. ROAS/ACOS reciprocal
  if (m.roas !== null && m.acos !== null && m.acos > 0) {
    results.push({
      name: 'roas_acos_reciprocal',
      passed: Math.abs(m.roas - 1 / m.acos) < 0.01,
      description: 'ROAS must equal 1/ACOS',
      severity: 'warning',
      autoHealed: false,
    });
  }

  // 5. TACoS <= ACOS
  if (m.tacos !== null && m.acos !== null) {
    results.push({
      name: 'tacos_lte_acos',
      passed: m.tacos <= m.acos + tol,
      description: 'TACoS must be ≤ ACOS because total sales ≥ ad sales',
      severity: 'error',
      autoHealed: false,
    });
  }

  // 6. Spend is non-negative
  results.push({
    name: 'spend_positive',
    passed: m.adSpend >= 0,
    description: 'Ad spend cannot be negative',
    severity: 'error',
    autoHealed: false,
  });

  // 7. CPC identity
  if (m.cpc !== null && m.adClicks > 0) {
    const expected = m.adSpend / m.adClicks;
    results.push({
      name: 'cpc_identity',
      passed: Math.abs(m.cpc - expected) / (expected || 1) < tol,
      description: 'CPC must equal adSpend / adClicks',
      severity: 'warning',
      autoHealed: false,
    });
  }

  return results;
}
