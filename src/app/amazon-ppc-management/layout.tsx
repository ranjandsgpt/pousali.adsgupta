import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Amazon PPC Management | Pousali Dasgupta",
  description: "Amazon PPC management services helping brands scale profitable campaigns, reduce ACOS and increase marketplace sales.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
