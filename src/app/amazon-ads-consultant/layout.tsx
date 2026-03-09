import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Amazon Ads Consultant',
  description:
    'Helping brands scale through advanced Amazon PPC strategies, keyword research, and marketplace optimization.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
