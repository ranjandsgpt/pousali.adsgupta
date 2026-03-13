import type { Metadata } from 'next';
import WorkPageContent from '@/components/work-page-content';

export const metadata: Metadata = {
  title: 'Work & Case Studies | Pousali Dasgupta | Amazon Marketplace Growth',
  description:
    'Real results: 10x marketplace ROI, Amazon PPC turnarounds, Walmart advertising launches. See the numbers behind the strategy.',
  alternates: {
    canonical: 'https://pousali.adsgupta.com/work',
  },
};

export default function WorkPage() {
  return <WorkPageContent />;
}
