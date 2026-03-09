import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Amazon Advertising Tools | Pousali Dasgupta',
  description: 'Amazon PPC audit tools, keyword analyzers and campaign dashboards. Tools coming soon.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
