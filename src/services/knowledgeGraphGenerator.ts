/**
 * Self-Updating Knowledge Graph — Links agents, charts, metrics, formulas, API endpoints, docs.
 * Output: docs/generated/knowledge-graph.json
 * Powers: related articles, search relevance, auto suggestions.
 */

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { SIDEBAR_SECTIONS } from '../app/amazon_audit_faq/helpCenterSections';

const ROOT = typeof process !== 'undefined' && process.cwd ? process.cwd() : path.resolve('.');
const DOCS_GEN = path.join(ROOT, 'docs', 'generated');

export interface KnowledgeNode {
  id: string;
  type: 'article' | 'agent' | 'formula' | 'chart' | 'api' | 'metric';
  title: string;
  slug?: string;
  related?: string[];
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  generatedAt: string;
}

const RELATED_MAP: Record<string, string[]> = {
  'formulas': ['agents', 'copilot', 'query-system', 'charts'],
  'agents': ['architecture', 'query-system', 'export-system', 'feedback'],
  'copilot': ['query-system', 'agents', 'formulas', 'feedback'],
  'query-system': ['copilot', 'agents', 'formulas'],
  'brand-intelligence': ['agents', 'formulas', 'charts'],
  'export-system': ['agents', 'charts', 'architecture'],
  'charts': ['export-system', 'formulas', 'agents'],
  'feedback': ['copilot', 'agents'],
  'architecture': ['agents', 'export-system', 'copilot'],
  'getting-started': ['architecture', 'copilot', 'export-system'],
  'faq': ['formulas', 'copilot', 'charts', 'export-system'],
  'security': ['copilot', 'export-system'],
  'troubleshooting': ['export-system', 'copilot', 'query-system'],
};

export async function generateKnowledgeGraph(): Promise<string> {
  await mkdir(DOCS_GEN, { recursive: true });
  const nodes: KnowledgeNode[] = SIDEBAR_SECTIONS.map((s) => ({
    id: s.id,
    type: 'article' as const,
    title: s.title,
    slug: s.slug,
    related: RELATED_MAP[s.slug] ?? [],
  }));

  const graph: KnowledgeGraph = {
    nodes,
    generatedAt: new Date().toISOString(),
  };
  const outPath = path.join(DOCS_GEN, 'knowledge-graph.json');
  await writeFile(outPath, JSON.stringify(graph, null, 2), 'utf-8');
  return outPath;
}
