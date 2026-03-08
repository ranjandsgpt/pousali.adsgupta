import { redirect } from 'next/navigation';
import { loadDocsArticles } from '@/services/docsLoader';

export default async function AmazonAuditFaqPage() {
  const articles = await loadDocsArticles();
  const first = articles.find((a) => a.slug === 'getting-started') ?? articles.find((a) => a.slug === 'architecture_audit') ?? articles[0];
  redirect(first ? `/amazon_audit_faq/${first.slug}` : '/amazon_audit_faq/getting-started');
}
