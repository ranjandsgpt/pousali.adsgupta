import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Insights',
  description:
    'Amazon marketing insights: PPC mistakes, TACoS reduction, keyword strategy, product launch ad framework.',
  alternates: {
    canonical: 'https://pousali.adsgupta.com/insights',
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Amazon Advertising Insights',
  author: { '@type': 'Person', name: 'Pousali Dasgupta' },
  datePublished: '2024-01-01',
  publisher: { '@type': 'Person', name: 'Pousali Dasgupta' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {children}
    </>
  );
}
