import type { Metadata } from 'next';
import InsightsPageContent from '@/components/insights-page-content';

export const metadata: Metadata = {
  title: 'Insights',
  description:
    'Amazon marketing insights: PPC mistakes, TACoS reduction, keyword strategy, product launch ad framework.',
};

export default function InsightsPage() {
  return <InsightsPageContent />;
}
