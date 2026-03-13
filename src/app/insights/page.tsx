import type { Metadata } from 'next';
import InsightsPageContent from '@/components/insights-page-content';

export const metadata: Metadata = {
  title: 'Amazon & Marketplace Insights | Pousali Dasgupta',
  description:
    'Deep insights on Amazon PPC strategy, retail media trends, marketplace growth tactics, and advertising audit methodology.',
  alternates: {
    canonical: 'https://pousali.adsgupta.com/insights',
  },
};

export default function InsightsPage() {
  return <InsightsPageContent />;
}
