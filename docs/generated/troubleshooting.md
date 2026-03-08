# Troubleshooting

## Export fails with ENOENT

Ensure you are using the serverless-safe cache path. On Vercel, cache uses `/tmp/export-cache`. Locally, `project/export-cache`.

## PDF export fails

Python PDF may be unavailable. The pipeline falls back to Node (jsPDF). Check `renderPremiumAssets` and `renderNodePdf`.

## Copilot returns "cannot be answered"

The Query Intelligence Agent may have classified the question as `unknown` or `out_of_scope`. Check [Query Intelligence](/amazon_audit_faq/query-system) for supported intents.
