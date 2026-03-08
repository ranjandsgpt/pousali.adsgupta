# Amazon Audit Help Center

The help center is available at **/amazon_audit_faq** and is generated automatically from the codebase.

## Regenerating documentation

Run before build (e.g. in CI) so that the help center and static pages are up to date:

```bash
npm run generate-docs
npm run build
```

Or add to your deployment pipeline:

```yaml
- run: npm run generate-docs
- run: npm run build
```

## What gets generated

- **docs/generated/** — Markdown articles: getting-started, architecture, agents, formulas, charts, copilot, query-system, brand-intelligence, export-system, feedback, security, troubleshooting, faq, code, architecture-diagram.
- **docs/generated/knowledge-graph.json** — Nodes and related-article links for search and suggestions.
- **docs/generated/code-intelligence/** — Per-file docs for `src/agents`, `src/services`, `src/lib`, `src/app/api`.

## Help center features

- **Sidebar** — Sections: Getting Started, Platform Architecture, Agents & Intelligence, Metrics & Formulas, Charts, AI Copilot, Query Intelligence, Brand Intelligence, Export System, Feedback, Security, Troubleshooting, FAQ, Code Explorer.
- **Search** — Fuzzy search (Fuse.js) over section titles and slugs.
- **Dynamic articles** — Each section loads from `docs/generated/{slug}.md`.
- **Related articles** — From knowledge graph.
- **APIs** — `/api/docs-answer` (POST with `question`) for doc-style answers; `/api/explain-code` (GET with `filePath` or `functionName`) for code explanations.

## Git hook (optional)

To regenerate docs on every commit or push, add a pre-commit or pre-push script that runs `npm run generate-docs` (e.g. with husky).
