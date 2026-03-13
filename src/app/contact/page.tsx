import type { Metadata } from 'next';
import ContactPageContent from '@/components/contact-page-content';

export const metadata: Metadata = {
  title: 'Hire Pousali Dasgupta | Amazon & Marketplace Growth Consultant',
  description:
    'Available for Amazon advertising strategy, marketplace growth consulting, and agency partnerships.',
  alternates: {
    canonical: 'https://pousali.adsgupta.com/contact',
  },
};

export default function ContactPage() {
  return <ContactPageContent />;
}
