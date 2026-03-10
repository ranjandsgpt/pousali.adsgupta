import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Amazon PPC Management | Pousali Dasgupta',
  description:
    'Amazon PPC management services helping brands scale profitable campaigns, reduce ACOS and increase marketplace sales.',
  alternates: {
    canonical: 'https://pousali.adsgupta.com/amazon-ppc-management',
  },
};

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Amazon PPC Management',
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
