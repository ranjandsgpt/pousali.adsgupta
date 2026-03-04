import type { Metadata } from 'next';
import ContactPageContent from '@/components/contact-page-content';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with Pousali Dasgupta for Amazon Ads consultancy, brand growth strategy, and marketplace expansion.',
};

export default function ContactPage() {
  return <ContactPageContent />;
}
