import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Professional bio and experience of Pousali Dasgupta — Amazon Ads, PPC strategy, search term mining, product launch strategy, marketplace analytics.',
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
