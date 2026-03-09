import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Amazon PPC Strategy',
  description:
    'How Amazon PPC works, keyword targeting, campaign structuring, and scaling profitable campaigns.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
