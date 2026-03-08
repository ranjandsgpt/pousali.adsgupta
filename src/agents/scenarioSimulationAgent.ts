/**
 * Scenario Simulation Agent — Answer forecasting questions.
 * Simulate spend changes, estimate ROAS/sales impact.
 */

export interface ScenarioResult {
  scenario: string;
  currentSpend: number;
  newSpend: number;
  estimatedSalesChange: number;
  estimatedRoasImpact: string;
  caveat: string;
}

export interface ScenarioInput {
  question: string;
  currentSpend?: number;
  currentSales?: number;
  currentRoas?: number;
  deltaPercent?: number;
  pauseCampaigns?: string[];
}

/**
 * Simulate "what if" scenarios (e.g. increase budget 20%, pause campaigns).
 */
export function runScenarioSimulationAgent(input: ScenarioInput): ScenarioResult {
  const {
    currentSpend = 0,
    currentSales = 0,
    currentRoas = currentSpend > 0 ? currentSales / currentSpend : 0,
    deltaPercent = 0,
  } = input;
  const newSpend = currentSpend * (1 + (deltaPercent ?? 0) / 100);
  const estimatedSalesChange = currentRoas > 0 ? (newSpend - currentSpend) * currentRoas : 0;
  let scenario = 'Budget change';
  if (input.deltaPercent && input.deltaPercent > 0) scenario = `Increase budget by ${input.deltaPercent}%`;
  else if (input.deltaPercent && input.deltaPercent < 0) scenario = `Decrease budget by ${Math.abs(input.deltaPercent)}%`;
  if (input.pauseCampaigns?.length) scenario += `; pause ${input.pauseCampaigns.length} campaign(s)`;

  return {
    scenario,
    currentSpend,
    newSpend,
    estimatedSalesChange,
    estimatedRoasImpact: currentRoas > 0
      ? `If ROAS holds constant (${currentRoas.toFixed(2)}×), estimated additional sales: ${estimatedSalesChange.toFixed(0)}`
      : 'ROAS unknown; run audit for baseline.',
    caveat: 'Estimate assumes ROAS and conversion rates remain constant; actual results may vary.',
  };
}
