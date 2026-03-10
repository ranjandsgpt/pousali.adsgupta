export interface CurrencyConsistencyInput {
  values: unknown[];
}

export interface CurrencyConsistencyOutput {
  currencies: string[];
  warnings: string[];
}

export function runCurrencyConsistencyAgent(input: CurrencyConsistencyInput): CurrencyConsistencyOutput {
  const symbols = new Set<string>();
  for (const v of input.values) {
    if (typeof v !== 'string') continue;
    if (v.includes('£')) symbols.add('£');
    if (v.includes('$')) symbols.add('$');
    if (v.includes('€')) symbols.add('€');
  }

  const currencies = Array.from(symbols);
  const warnings: string[] = [];
  if (currencies.length > 1) {
    warnings.push(`Mixed currencies detected in dataset: ${currencies.join(', ')}.`);
  }

  return { currencies, warnings };
}

