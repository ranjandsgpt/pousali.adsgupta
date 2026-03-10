import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Amazon PPC Audit | Pousali Dasgupta',
  description:
    'Professional Amazon PPC audit services to identify wasted ad spend, optimize campaigns and improve advertising profitability.',
  alternates: {
    canonical: 'https://pousali.adsgupta.com/amazon-ppc-audit',
  },
};

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Amazon PPC Audit',
  provider: {
    '@type': 'Person',
    name: 'Pousali Dasgupta',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      {children}
    </>
  );
}
