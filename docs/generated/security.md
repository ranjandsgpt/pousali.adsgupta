# Security & Validation

- **Metric verification:** Numeric claims in Copilot responses are validated against storeSummary.
- **Response validation:** `validateCopilotResponse` checks ACOS, spend, sales, ROAS against audit data.
- **Export consistency:** `checkExportConsistency` ensures UI, PremiumState, and export match within tolerance.
