# Brand Intelligence

## Purpose

Classifies search terms into **branded**, **competitor**, or **generic** based on brand and competitor lists.

## Inputs

- `searchTerms[]` — term, sales, spend
- `brandNames[]` — brand tokens
- `competitorBrands[]` — competitor tokens

## Output

- `brandedSales`, `genericSales`, `competitorSales`
- Per-term `BrandAnalysisItem` with `keywordType`

## Logic

- Term contains a brand name → branded
- Term contains a competitor name → competitor
- Else → generic
