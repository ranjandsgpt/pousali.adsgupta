/**
 * Documentation AI Copilot — Answers help-center questions using generated docs and knowledge graph.
 * Used by the help center UI for "Ask about docs" or inline suggestions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const DOCS_GEN = path.join(process.cwd(), 'docs', 'generated');

const FAQ_ANSWERS: Array<{ q: string[]; answer: string; slug: string }> = [
  { q: ['roas', 'calculate', 'calculated'], answer: 'ROAS = Ad Sales / Ad Spend. ROAS > 3 indicates efficient ad spend; ROAS < 1 indicates loss-making campaigns.', slug: 'formulas' },
  { q: ['acos', 'high', 'low'], answer: 'ACOS = (Ad Spend / Ad Sales) × 100. Lower is better; target typically 15–30% for profitability.', slug: 'formulas' },
  { q: ['cxo judge', 'export', 'visual'], answer: 'CXO Judge verifies exports: metric accuracy, slide density, table rows, chart readability. On failure it can return PASSED_WITH_WARNINGS and use a simplified layout so downloads never block.', slug: 'export-system' },
  { q: ['export', 'pipeline', 'pptx', 'pdf'], answer: 'The Zenith Export Pipeline builds PremiumState, renders charts (Python or Node fallback), runs CXO Judge, then produces PPTX and PDF. Cache is in project/export-cache locally or /tmp/export-cache on Vercel.', slug: 'export-system' },
  { q: ['copilot', 'how does', 'work'], answer: 'The AI Copilot uses the Query Intelligence Agent to classify your question, then routes metric queries to the SLM (deterministic) and explanations/strategy to Gemini.', slug: 'copilot' },
  { q: ['query', 'intent', 'intelligence'], answer: 'Query Intelligence detects intent (metric, formula, dataset, diagnostic, strategy, etc.) and capability (available, derivable, unknown, out_of_scope), then routes to SLM, metrics library, or Gemini.', slug: 'query-system' },
  { q: ['brand', 'intelligence', 'branded'], answer: 'Brand Intelligence classifies search terms into branded, competitor, or generic using your brand and competitor lists. Outputs brandedSales, genericSales, competitorSales.', slug: 'brand-intelligence' },
  { q: ['chart', 'generated', 'render'], answer: 'Charts are rendered from PremiumState by the Python export_engine (8s timeout) or Node fallback. Charts are generated in parallel for performance.', slug: 'charts' },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const question = (body.question ?? body.q ?? '').trim().toLowerCase();
    if (!question) {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 });
    }

    for (const faq of FAQ_ANSWERS) {
      if (faq.q.some((k) => question.includes(k))) {
        return NextResponse.json({
          answer: faq.answer,
          slug: faq.slug,
          href: `/amazon_audit_faq/${faq.slug}`,
        });
      }
    }

    try {
      const faqPath = path.join(DOCS_GEN, 'faq.md');
      const content = await readFile(faqPath, 'utf-8');
      const firstBlock = content.slice(0, 600);
      return NextResponse.json({
        answer: firstBlock.replace(/# FAQ\n\n/, '').slice(0, 500) + '…',
        slug: 'faq',
        href: '/amazon_audit_faq/faq',
      });
    } catch {
      //
    }

    return NextResponse.json({
      answer: 'Try searching the help center for "formulas", "copilot", "export", or "query system".',
      slug: 'faq',
      href: '/amazon_audit_faq/faq',
    });
  } catch (e) {
    console.error('[docs-answer]', e);
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}
