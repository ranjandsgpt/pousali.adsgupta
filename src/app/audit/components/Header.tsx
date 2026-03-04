import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--color-surface)]/80 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
            aria-label="Back to home"
          >
            <ArrowLeft size={18} />
            Back
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] text-center flex-1">
            Amazon Advertising Performance Audit
          </h1>
          <div className="w-16" aria-hidden />
        </div>
      </div>
    </header>
  );
}
