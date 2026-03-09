/**
 * Report Identifier — classify Amazon CSV reports by header set.
 *
 * This helper does NOT look at filenames. It uses header semantics only,
 * so locale variations (e.g. \"Ordered Product Sales (£)\") can still be
 * normalized by the upstream schema mapper.
 */

export type ReportTypeId =
  | 'search_term_report'
  | 'advertised_product_report'
  | 'campaign_report'
  | 'business_report'
  | 'unknown';

export interface IdentifiedReportType {
  reportType: ReportTypeId;
}

export function identifyReportType(headers: string[]): IdentifiedReportType {
  const normalized = (headers || []).map((h) => h.toLowerCase().trim());

  const has = (needle: string) =>
    normalized.some((h) => h.includes(needle.toLowerCase()));

  if (has('customer search term')) {
    return { reportType: 'search_term_report' };
  }

  if (has('advertised sku') || has('advertised asin')) {
    return { reportType: 'advertised_product_report' };
  }

  if (has('campaign name')) {
    return { reportType: 'campaign_report' };
  }

  if (has('ordered product sales')) {
    return { reportType: 'business_report' };
  }

  return { reportType: 'unknown' };
}

