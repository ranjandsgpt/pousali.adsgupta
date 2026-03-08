import { HelpCenterLayout } from '../components/HelpCenterLayout';
import { DiagnosticsViewer } from './DiagnosticsViewer';
import { buildDocsNavTree } from '@/services/docsLoader';

export default async function DiagnosticsPage() {
  const navTree = await buildDocsNavTree();
  const navNodes = navTree.filter((n) => n.slug).map((n) => ({ label: n.label, slug: n.slug }));
  const breadcrumbs = [{ label: 'Help', href: '/amazon_audit_faq' }, { label: 'Telemetry & Diagnostics' }];

  return (
    <HelpCenterLayout breadcrumbs={breadcrumbs} navNodes={navNodes}>
      <DiagnosticsViewer />
    </HelpCenterLayout>
  );
}
