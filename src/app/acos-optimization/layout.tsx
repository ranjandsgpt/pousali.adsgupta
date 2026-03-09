import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ACOS Optimization | Pousali Dasgupta',
  description:
    'ACOS optimization and Amazon campaign management: reduce ACOS, campaign restructuring, and search term optimization.',
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
    { '@type': 'ListItem', position: 3, name: 'Amazon ACOS Optimization' },
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
