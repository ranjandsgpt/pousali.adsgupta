import { normalizeHeader } from '@/app/audit/utils/headerMapper';

export interface ColumnMappingInput {
  headers: string[];
}

export interface ColumnMappingOutput {
  issues: string[];
}

const ALIAS_GROUPS: Record<string, string[]> = {
  spend: ['Spend', 'Cost', 'Total Cost'],
  sales7d: ['7 Day Total Sales', 'Attributed Sales'],
  clicks: ['Clicks'],
  orders: ['Orders'],
};

export function runColumnMappingAgent(input: ColumnMappingInput): ColumnMappingOutput {
  const issues: string[] = [];
  const normToAliasKey = new Map<string, string>();

  Object.entries(ALIAS_GROUPS).forEach(([canonical, aliases]) => {
    const present: string[] = [];
    aliases.forEach((alias) => {
      const norm = normalizeHeader(alias);
      if (input.headers.some((h) => normalizeHeader(h) === norm)) {
        present.push(alias);
        if (normToAliasKey.has(norm) && normToAliasKey.get(norm) !== canonical) {
          issues.push(
            `Column mapping conflict: header matching "${alias}" maps to multiple canonical fields (${canonical}, ${normToAliasKey.get(
              norm
            )}).`
          );
        } else {
          normToAliasKey.set(norm, canonical);
        }
      }
    });
    if (present.length > 1) {
      issues.push(
        `Multiple aliases for ${canonical} present in headers: ${present.join(
          ', '
        )}. Verify schema mapper chooses the correct source.`
      );
    }
  });

  return { issues };
}

