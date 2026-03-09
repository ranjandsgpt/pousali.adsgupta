import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Amazon Advertising Resources | Pousali Dasgupta',
  description:
    'Comprehensive Amazon advertising resources covering PPC strategy, ACOS optimization, keyword research and campaign management.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
