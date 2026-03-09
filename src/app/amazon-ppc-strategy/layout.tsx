import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Amazon PPC Strategy | Pousali Dasgupta',
  description:
    'Amazon PPC strategy and Amazon campaign management: keyword targeting, campaign structuring, and scaling profitable campaigns.',
  openGraph: {
    images: '/og/default.png',
  },
  other: {
    'article:modified_time': new Date().toISOString(),
  },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pousali.adsgupta.com' },
    { '@type': 'ListItem', position: 2, name: 'Insights', item: 'https://pousali.adsgupta.com/insights' },
    { '@type': 'ListItem', position: 3, name: 'Amazon PPC Strategy' },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
