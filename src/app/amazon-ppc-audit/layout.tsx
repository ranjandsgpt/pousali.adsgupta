import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Amazon PPC Audit | Pousali Dasgupta",
  description: "Professional Amazon PPC audit services to identify wasted ad spend, optimize campaigns and improve advertising profitability.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
