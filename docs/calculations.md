# Calculation Library

Every metric and insight calculation used in the platform. This page is the canonical reference (Phase 15).

## Total Ad Spend

**Definition:** Total ad spend is the sum of all campaign spend from the Campaign Report. Do not sum across Targeting or Search Term reports to avoid double counting.

**Formula:** `SUM(campaign_report.spend)`

**Source:** Campaign Report

---

## Total Ad Sales

**Definition:** Total attributed ad sales from the Campaign Report.

**Formula:** `SUM(campaign_report.sales)`

**Source:** Campaign Report

---

## Total Sales

**Definition:** Total store sales = Ad Sales + Organic Sales.

**Formula:** `Total Sales = Ad Sales + Organic Sales`

---

## Organic Sales

**Definition:** Sales not attributed to advertising. When not directly available: Total Sales − Ad Sales.

**Formula:** `Organic Sales = Total Sales − Ad Sales`

---

## TACOS

**Definition:** Total Advertising Cost of Sales. Percentage of total sales spent on ads.

**Formula:** `TACOS = Ad Spend / Total Sales` (× 100 for %)

**Dependency order:** Ad Spend (Campaign report) → Ad Sales (Campaign report) → Total Sales = Ad Sales + Organic Sales → TACOS = Ad Spend / Total Sales

---

## ACOS

**Definition:** Advertising Cost of Sales. Ad spend as percentage of ad-attributed sales.

**Formula:** `ACOS = Ad Spend / Ad Sales` (× 100 for %)

---

## ROAS

**Definition:** Return on Ad Spend. Revenue per unit of spend.

**Formula:** `ROAS = Ad Sales / Ad Spend`

---

## CVR

**Definition:** Conversion rate: percentage of clicks that resulted in orders.

**Formula:** `CVR = Orders / Clicks` (× 100 for %)

---

## CTR

**Definition:** Click-through rate: percentage of impressions that became clicks.

**Formula:** `CTR = Clicks / Impressions` (× 100 for %)

---

## CPC

**Definition:** Cost per click.

**Formula:** `CPC = Ad Spend / Clicks`

---

## Wasted Keywords

**Definition:** Search terms that have received at least 10 clicks but have generated zero sales.

**Formula:** `clicks >= 10 AND sales = 0`

**Source:** Search Term Report

---

## Health Score

**Definition:** Weighted index (0–100) from profitability, waste, efficiency. Weights: profitability 40%, waste penalty 30%, ROAS 15%, TACOS 15%.

**Formula:** `Weighted(contributionMarginPct, wastePctOfSpend, roas, tacosPct)`

---

## Match Type Spend Chart

**Definition:** Auto vs Manual (Targeting Report). Manual breakdown: Broad, Phrase, Exact, Product Targeting.

**Source:** Targeting Report

---

## Converting Search Terms Missing Exact

**Definition:** High-converting search terms not targeted as Exact match keywords. Filter: clicks > threshold, orders > 0. Group by matchType, searchTerm.

**Source:** Search Term Report
