/**
 * Section 13: Date normalization engine.
 * All dates → YYYY-MM-DD for trend charts, daily spend, campaign pacing.
 */

const MONTH_ABBREV: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/**
 * Normalize date string to YYYY-MM-DD.
 * Handles: 2026-02-23, 02/23/2026, 23-02-2026, Feb 23 2026 (and similar).
 */
export function normalizeDate(dateString: unknown): string {
  if (dateString == null || dateString === '') return '';
  const str = String(dateString).trim();
  if (!str) return '';

  // Already YYYY-MM-DD
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  let m = str.match(iso);
  if (m) {
    const y = m[1];
    const mo = m[2].padStart(2, '0');
    const d = m[3].padStart(2, '0');
    return `${y}-${mo}-${d}`;
  }

  // MM/DD/YYYY or MM-DD-YYYY
  const us = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
  m = str.match(us);
  if (m) {
    const mo = m[1].padStart(2, '0');
    const d = m[2].padStart(2, '0');
    const y = m[3];
    return `${y}-${mo}-${d}`;
  }

  // DD-MM-YYYY or DD/MM/YYYY (e.g. 23-02-2026)
  const eu = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
  m = str.match(eu);
  if (m) {
    const d = m[1].padStart(2, '0');
    const mo = m[2].padStart(2, '0');
    const y = m[3];
    return `${y}-${mo}-${d}`;
  }

  // Month name: Feb 23 2026, 23 Feb 2026, February 23, 2026
  const withMonth = str.match(
    /(\d{1,2})\s+([a-zA-Z]{3,9})\s+(\d{4})|([a-zA-Z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/
  );
  if (withMonth) {
    let day: string;
    let monthStr: string;
    let year: string;
    if (withMonth[1]) {
      day = withMonth[1].padStart(2, '0');
      monthStr = withMonth[2];
      year = withMonth[3];
    } else {
      monthStr = withMonth[4];
      day = withMonth[5].padStart(2, '0');
      year = withMonth[6];
    }
    const monthNum = MONTH_ABBREV[monthStr.toLowerCase().slice(0, 3)];
    if (monthNum) {
      const month = String(monthNum).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  return str;
}
