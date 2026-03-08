import { readFile } from 'fs/promises';
import path from 'path';
import { notFound } from 'next/navigation';
import { HelpCenterLayout } from '../components/HelpCenterLayout';
import { ArticleViewer } from '../components/ArticleViewer';
import { loadDocsArticles, resolveArticleBySlug, getArticleContent, buildDocsNavTree } from '@/services/docsLoader';

const RELATED_MAP: Record<string, string[]> = {
  formulas: ['agents', 'copilot', 'query-system', 'charts'],
  agents: ['architecture', 'query-system', 'export-system', 'feedback'],
  copilot: ['query-system', 'agents', 'formulas', 'feedback'],
  'query-system': ['copilot', 'agents', 'formulas'],
  'brand-intelligence': ['agents', 'formulas', 'charts'],
  'export-system': ['agents', 'charts', 'architecture'],
  charts: ['export-system', 'formulas', 'agents'],
  feedback: ['copilot', 'agents'],
  architecture: ['agents', 'export-system', 'copilot'],
  'getting-started': ['architecture', 'copilot', 'export-system'],
  faq: ['formulas', 'copilot', 'charts', 'export-system'],
  security: ['copilot', 'export-system'],
  troubleshooting: ['export-system', 'copilot', 'query-system'],
  code: ['agents', 'export-system', 'copilot'],
  architecture_audit: ['validation_architecture', 'metrics_resolution', 'agents'],
  validation_architecture: ['architecture_audit', 'security'],
  metrics_resolution: ['formulas', 'architecture_audit'],
  gemini_audit_fix: ['copilot', 'validation_architecture'],
};

export async function generateStaticParams() {
  const articles = await loadDocsArticles();
  return articles.map((a) => ({ article: a.slug }));
}

export default async function ArticlePage({ params }: { params: { article: string } }) {
  const slug = params.article;
  const article = await resolveArticleBySlug(slug);
  let content: string;
  let title: string;

  if (article) {
    content = await getArticleContent(article.path);
    title = article.title;
  } else {
    const legacyPath = path.join(process.cwd(), 'docs', 'generated', `${slug}.md`);
    try {
      content = await readFile(legacyPath, 'utf-8');
      title = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    } catch {
      notFound();
    }
  }

  const navTree = await buildDocsNavTree();
  const navNodes = navTree.filter((n) => n.slug).map((n) => ({ label: n.label, slug: n.slug }));
  const breadcrumbs = [{ label: 'Help', href: '/amazon_audit_faq' }, { label: title }];
  const relatedSlugs = RELATED_MAP[slug] ?? [];

  return (
    <HelpCenterLayout breadcrumbs={breadcrumbs} relatedSlugs={relatedSlugs} navNodes={navNodes}>
      <ArticleViewer content={content} />
    </HelpCenterLayout>
  );
}
