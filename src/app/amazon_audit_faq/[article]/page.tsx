import { readFile } from 'fs/promises';
import path from 'path';
import { notFound } from 'next/navigation';
import { HelpCenterLayout } from '../components/HelpCenterLayout';
import { ArticleViewer } from '../components/ArticleViewer';
import { SIDEBAR_SECTIONS } from '../helpCenterSections';

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
};

export async function generateStaticParams() {
  return SIDEBAR_SECTIONS.map((s) => ({ article: s.slug }));
}

export default async function ArticlePage({ params }: { params: { article: string } }) {
  const slug = params.article;
  const valid = SIDEBAR_SECTIONS.some((s) => s.slug === slug);
  if (!valid) notFound();

  const root = path.join(process.cwd(), 'docs', 'generated');
  const filePath = path.join(root, `${slug}.md`);
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    content = `# ${slug.replace(/-/g, ' ')}\n\nDocumentation for this section will be generated when you run \`npm run generate-docs\`.`;
  }

  const section = SIDEBAR_SECTIONS.find((s) => s.slug === slug);
  const title = section?.title ?? slug.replace(/-/g, ' ');
  const breadcrumbs = [{ label: 'Help', href: '/amazon_audit_faq' }, { label: title }];
  const relatedSlugs = RELATED_MAP[slug] ?? [];

  return (
    <HelpCenterLayout breadcrumbs={breadcrumbs} relatedSlugs={relatedSlugs}>
      <ArticleViewer content={content} />
    </HelpCenterLayout>
  );
}
