import { sanitizeNumeric } from '@/utils/sanitizeNumeric';

export interface CurrencyNormalizationInput {
  values: unknown[];
}

export interface CurrencyNormalizationOutput {
  normalized: number[];
}

export function runCurrencyNormalizationAgent(input: CurrencyNormalizationInput): CurrencyNormalizationOutput {
  const normalized = input.values.map((v) => sanitizeNumeric(v));
  return { normalized };
}

