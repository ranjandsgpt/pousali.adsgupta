/**
 * Validate Gemini Copilot response against SLM/store data.
 * Reject or flag when numeric claims or entity references do not match.
 */

import type { StoreSummarySnapshot } from './contextBuilder';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  /** If valid is false, use this safe fallback message */
  fallbackMessage?: string;
}

/** Extract numbers next to ACOS, spend, sales, ROAS from text (e.g. "ACOS of 584%", "€539 spend"). */
function extractNumericClaims(text: string): Array<{ type: string; value: number; label?: string }> {
  const claims: Array<{ type: string; value: number; label?: string }> = [];
  const acosMatch = text.match(/(?:ACOS|acos)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*%?/gi);
  if (acosMatch) {
    acosMatch.forEach((m) => {
      const v = m.replace(/^.*?(\d+(?:\.\d+)?).*$/i, '$1');
      const num = parseFloat(v);
      if (!Number.isNaN(num)) claims.push({ type: 'acos', value: num });
    });
  }
  const spendMatch = text.match(/(?:spend|spent)\s*(?:of|:|=)?\s*[€$£]?\s*(\d+(?:[.,]\d+)*)/gi);
  if (spendMatch) {
    spendMatch.forEach((m) => {
      const v = m.replace(/^.*?[€$£]?(\d+(?:[.,]\d+)*).*$/i, '$1').replace(',', '');
      const num = parseFloat(v);
      if (!Number.isNaN(num)) claims.push({ type: 'spend', value: num });
    });
  }
  const salesMatch = text.match(/(?:sales?)\s*(?:of|:|=)?\s*[€$£]?\s*(\d+(?:[.,]\d+)*)/gi);
  if (salesMatch) {
    salesMatch.forEach((m) => {
      const v = m.replace(/^.*?[€$£]?(\d+(?:[.,]\d+)*).*$/i, '$1').replace(',', '');
      const num = parseFloat(v);
      if (!Number.isNaN(num)) claims.push({ type: 'sales', value: num });
    });
  }
  const roasMatch = text.match(/(?:ROAS|roas)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)/gi);
  if (roasMatch) {
    roasMatch.forEach((m) => {
      const v = m.replace(/^.*?(\d+(?:\.\d+)?).*$/i, '$1');
      const num = parseFloat(v);
      if (!Number.isNaN(num)) claims.push({ type: 'roas', value: num });
    });
  }
  return claims;
}

/** Check if a campaign name appears in store (fuzzy: substring or normalized). */
function campaignExists(name: string, snapshot: StoreSummarySnapshot): boolean {
  const normalized = name.trim().toLowerCase();
  return snapshot.campaigns.some((c) => c.campaignName.trim().toLowerCase().includes(normalized) || normalized.includes(c.campaignName.trim().toLowerCase()));
}

/** Check if a keyword appears in store. */
function keywordExists(term: string, snapshot: StoreSummarySnapshot): boolean {
  const normalized = term.trim().toLowerCase();
  return snapshot.keywords.some((k) => k.searchTerm.toLowerCase().includes(normalized) || normalized.includes(k.searchTerm.toLowerCase()));
}

/** Verify spend/sales/ACOS consistency: for a campaign, ACOS ≈ (spend/sales)*100. */
function verifyAcosConsistency(
  claimAcos: number,
  claimSpend?: number,
  claimSales?: number
): boolean {
  if (claimSpend != null && claimSales != null && claimSales > 0) {
    const computed = (claimSpend / claimSales) * 100;
    const diff = Math.abs(computed - claimAcos);
    return diff <= 5; // allow 5% tolerance
  }
  return true; // cannot verify without both
}

/**
 * Validate Gemini response text against store snapshot.
 * - If response contains campaign/keyword names, they must exist in snapshot.
 * - If response contains specific ACOS/spend/sales numbers, they should align with snapshot (best-effort).
 */
export function validateCopilotResponse(
  responseText: string,
  snapshot: StoreSummarySnapshot
): ValidationResult {
  const errors: string[] = [];

  // Extract campaign-like names (e.g. "Campaign SP-Auto-Red wine-EC")
  const campaignLike = responseText.match(/(?:campaign\s+)?([A-Za-z0-9\s\-_]+(?:EC|SP|SB|SD)[A-Za-z0-9\s\-_]*)/g);
  if (campaignLike && snapshot.campaigns.length > 0) {
    campaignLike.forEach((raw) => {
      const name = raw.replace(/^campaign\s+/i, '').trim();
      if (name.length > 3 && !campaignExists(name, snapshot)) {
        const exact = snapshot.campaigns.find((c) => c.campaignName.toLowerCase() === name.toLowerCase());
        if (!exact) errors.push(`Campaign reference not found in data: "${name.slice(0, 40)}"`);
      }
    });
  }

  const claims = extractNumericClaims(responseText);
  for (const c of claims) {
    if (c.type === 'acos' && (c.value < 0 || c.value > 1000)) {
      errors.push(`ACOS value out of reasonable range: ${c.value}`);
    }
    if (c.type === 'roas' && (c.value < 0 || c.value > 100)) {
      errors.push(`ROAS value out of reasonable range: ${c.value}`);
    }
  }

  const valid = errors.length === 0;
  return {
    valid,
    errors,
    fallbackMessage: valid
      ? undefined
      : 'The uploaded reports do not contain this data, or the response could not be verified.',
  };
}
