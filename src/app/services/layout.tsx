import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Amazon Advertising Services | Pousali Dasgupta',
  description:
    'Amazon advertising services including PPC management, campaign audits, keyword research and ACOS optimization.',
};

const serviceSchemas = [
  { '@context': 'https://schema.org', '@type': 'Service', serviceType: 'Amazon PPC Management', provider: { '@type': 'Person', name: 'Pousali Dasgupta' } },
  { '@context': 'https://schema.org', '@type': 'Service', serviceType: 'Amazon PPC Audit', provider: { '@type': 'Person', name: 'Pousali Dasgupta' } },
  { '@context': 'https://schema.org', '@type': 'Service', serviceType: 'Keyword Research', provider: { '@type': 'Person', name: 'Pousali Dasgupta' } },
  { '@context': 'https://schema.org', '@type': 'Service', serviceType: 'ACOS Optimization', provider: { '@type': 'Person', name: 'Pousali Dasgupta' } },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {serviceSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      {children}
    </>
  );
}
