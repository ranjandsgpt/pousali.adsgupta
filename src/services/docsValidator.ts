/**
 * Documentation Quality Validator — Check missing articles, broken links, missing diagrams.
 * Run during build or npm run generate-docs.
 */

import { readFile, readdir } from 'fs/promises';
import path from 'path';
import { SIDEBAR_SECTIONS } from '../app/amazon_audit_faq/helpCenterSections';

const ROOT = typeof process !== 'undefined' && process.cwd ? process.cwd() : path.resolve('.');
const DOCS_GEN = path.join(ROOT, 'docs', 'generated');

export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export async function runDocsValidator(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const files: string[] = await readdir(DOCS_GEN).catch(() => []);
    const expectedSlugs = new Set(SIDEBAR_SECTIONS.map((s) => `${s.slug}.md`));

    for (const slug of Array.from(expectedSlugs)) {
      if (!files.includes(slug)) {
        errors.push(`Missing article: ${slug}`);
      }
    }

    if (!files.includes('knowledge-graph.json')) {
      warnings.push('Missing knowledge-graph.json');
    }

    for (const f of files) {
      if (!f.endsWith('.md') && f !== 'knowledge-graph.json') continue;
      const content = await readFile(path.join(DOCS_GEN, f), 'utf-8').catch(() => '');
      if (f.endsWith('.md') && content.length < 50) {
        warnings.push(`Article ${f} is very short`);
      }
      const linkMatches = content.match(/\]\(\s*\/?amazon_audit_faq\/([^)\s]+)\s*\)/g);
      if (linkMatches) {
        for (const m of linkMatches) {
          const slug = m.replace(/\]\(\s*\/?amazon_audit_faq\/([^)\s]+)\s*\)/, '$1').replace(/\/$/, '');
          const expected = `${slug}.md`;
          if (!files.includes(expected) && !expectedSlugs.has(expected)) {
            warnings.push(`Possible broken link in ${f}: ${slug}`);
          }
        }
      }
    }
  } catch (e) {
    errors.push(`Validator failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}
