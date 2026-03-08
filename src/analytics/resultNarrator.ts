/**
 * Natural Language Result Generator — Transform query results into readable responses.
 */

import type { QueryRow } from './datasetQueryEngine';

export function narrateResult(
  rows: QueryRow[],
  options: { metric?: string; title?: string; limit?: number }
): string {
  const { metric = 'ROAS', title = 'Results', limit = 5 } = options;
  const slice = rows.slice(0, limit);
  if (slice.length === 0) return `No ${title.toLowerCase()} match the criteria.`;
  const lines = slice.map((r, i) => {
    const name = (r.campaignName ?? r.searchTerm ?? r.campaign ?? 'Item') as string;
    const value = metric in r ? (r[metric] ?? r.roas ?? r.acos ?? r.spend) : r.roas ?? r.acos ?? r.spend;
    const formatted = typeof value === 'number' ? (metric === 'ACOS' ? `${value.toFixed(1)}%` : value.toFixed(2)) : String(value);
    return `${i + 1}. ${name.slice(0, 40)} — ${metric} ${formatted}`;
  });
  return `The top ${slice.length} ${title.toLowerCase()} by ${metric} are:\n\n${lines.join('\n')}`;
}
