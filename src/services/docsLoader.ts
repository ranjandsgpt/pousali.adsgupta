/**
 * Docs Loader — Live mirror of /docs for the help center.
 * Scans docs/, docs/generated/, docs/generated/code-intelligence/ and builds navigation tree.
 * Run on server (Node fs); used by FAQ route and sidebar.
 */

import { readdir, readFile } from 'fs/promises';
import path from 'path';

const ROOT = typeof process !== 'undefined' && process.cwd ? process.cwd() : path.resolve('.');
const DOCS_ROOT = path.join(ROOT, 'docs');

export interface DocArticle {
  title: string;
  slug: string;
  path: string;
  category: 'docs' | 'generated' | 'code-intelligence';
}

export interface DocNavNode {
  label: string;
  slug: string;
  children?: DocNavNode[];
}

function fileToSlug(relativePath: string): string {
  const base = path.basename(relativePath, '.md');
  return base
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'article';
}

function fileToTitle(filename: string): string {
  const base = path.basename(filename, '.md');
  return base
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/^Architecture Audit$/i, 'Architecture Audit')
    .replace(/^Validation Architecture$/i, 'Validation Architecture')
    .replace(/^Metrics Resolution$/i, 'Metrics Resolution')
    .replace(/^Gemini Audit Fix$/i, 'Gemini Audit Fix');
}

async function scanDir(dir: string, baseDir: string, category: DocArticle['category']): Promise<DocArticle[]> {
  const out: DocArticle[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      const rel = path.relative(baseDir, full);
      if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
        out.push(...(await scanDir(full, baseDir, category)));
      } else if (e.isFile() && e.name.endsWith('.md')) {
        const slug = fileToSlug(rel);
        out.push({
          title: fileToTitle(e.name),
          slug,
          path: path.relative(ROOT, full),
          category,
        });
      }
    }
  } catch {
    //
  }
  return out;
}

/** Load all articles from docs, docs/generated, docs/generated/code-intelligence */
export async function loadDocsArticles(): Promise<DocArticle[]> {
  const [rootDocs, generated, codeIntel] = await Promise.all([
    scanDir(DOCS_ROOT, DOCS_ROOT, 'docs'),
    scanDir(path.join(DOCS_ROOT, 'generated'), DOCS_ROOT, 'generated'),
    scanDir(path.join(DOCS_ROOT, 'generated', 'code-intelligence'), DOCS_ROOT, 'code-intelligence'),
  ]);
  const all = [...rootDocs, ...generated, ...codeIntel];
  const bySlug = new Map<string, DocArticle>();
  for (const a of all) {
    if (!bySlug.has(a.slug)) bySlug.set(a.slug, a);
    else {
      const existing = bySlug.get(a.slug)!;
      if (a.category === 'docs') bySlug.set(a.slug, a);
      else if (existing.category !== 'docs' && a.category === 'generated') bySlug.set(a.slug, a);
    }
  }
  return Array.from(bySlug.values());
}

/** Build navigation tree: Architecture, Gemini Audit Fix, ... (root) | Generated Docs (generated) | Code Intelligence (code-intelligence) */
export async function buildDocsNavTree(): Promise<DocNavNode[]> {
  const articles = await loadDocsArticles();
  const root: DocArticle[] = [];
  const generated: DocArticle[] = [];
  const codeIntel: DocArticle[] = [];
  for (const a of articles) {
    if (a.category === 'docs') root.push(a);
    else if (a.category === 'code-intelligence') codeIntel.push(a);
    else generated.push(a);
  }
  const sortByTitle = (a: DocArticle, b: DocArticle) => a.title.localeCompare(b.title);
  root.sort(sortByTitle);
  generated.sort(sortByTitle);
  codeIntel.sort(sortByTitle);
  const nodes: DocNavNode[] = [];
  if (root.length) {
    nodes.push({ label: 'Documentation', slug: '' });
    root.forEach((a) => nodes.push({ label: a.title, slug: a.slug }));
  }
  if (generated.length) {
    nodes.push({ label: 'Generated Docs', slug: '' });
    generated.forEach((a) => nodes.push({ label: a.title, slug: a.slug }));
  }
  if (codeIntel.length) {
    nodes.push({ label: 'Code Intelligence', slug: '' });
    codeIntel.slice(0, 25).forEach((a) => nodes.push({ label: a.title, slug: a.slug }));
    if (codeIntel.length > 25) nodes.push({ label: `… and ${codeIntel.length - 25} more`, slug: codeIntel[25].slug });
  }
  nodes.push({ label: 'Telemetry & Diagnostics', slug: 'diagnostics' });
  nodes.push({ label: 'Links', slug: 'links' });
  return nodes;
}

/** Resolve slug to article; returns path relative to cwd for readFile */
export async function resolveArticleBySlug(slug: string): Promise<DocArticle | null> {
  const articles = await loadDocsArticles();
  return articles.find((a) => a.slug === slug) ?? null;
}

/** Get content for an article by path (relative to ROOT) */
export async function getArticleContent(articlePath: string): Promise<string> {
  const full = path.join(ROOT, articlePath);
  return readFile(full, 'utf-8').catch(() => '');
}
