import type { Metadata } from 'next';
import MetricsReferenceLoader from './components/MetricsReferenceLoader';

export const metadata: Metadata = {
  title: 'Amazon Advertising Performance Audit',
  description:
    'Transform Amazon CSV exports into a One-Sheet audit. TACOS, Bleeders, ASIN-level profitability.',
};

export default function AuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MetricsReferenceLoader />
      {children}
    </>
  );
}
