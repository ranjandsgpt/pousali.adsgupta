import type { Metadata } from 'next';
import WorkPageContent from '@/components/work-page-content';

export const metadata: Metadata = {
  title: 'Work & Case Studies',
  description:
    'Amazon Ads case studies: Omega 3 growth, Maca Root launch, supplement category scaling. ACOS improvement, revenue growth, TACoS reduction.',
};

export default function WorkPage() {
  return <WorkPageContent />;
}
