/**
 * Dataset Query Engine — Run aggregations, filters, sort, limit.
 */

import type { ParsedQuery } from './semanticQueryParser';

export interface QueryRow {
  [key: string]: string | number | undefined;
}

export function runDatasetQuery(rows: QueryRow[], parsed: ParsedQuery): QueryRow[] {
  let result = [...rows];
  const { filters = [], sort, limit, metric } = parsed;

  for (const f of filters) {
    result = result.filter((r) => {
      const v = r[f.field];
      if (v === undefined) return false;
      if (f.op === '=') return Number(v) === Number(f.value);
      if (f.op === '>') return Number(v) > Number(f.value);
      if (f.op === '<') return Number(v) < Number(f.value);
      return true;
    });
  }

  const sortField = metric || 'roas';
  if (sort && (result[0] && sortField in result[0])) {
    result.sort((a, b) => {
      const va = Number(a[sortField]) || 0;
      const vb = Number(b[sortField]) || 0;
      return parsed.sort === 'desc' ? vb - va : va - vb;
    });
  }

  if (parsed.limit) result = result.slice(0, parsed.limit);
  return result;
}
