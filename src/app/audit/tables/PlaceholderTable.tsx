'use client';

interface PlaceholderTableProps {
  title?: string;
}

export default function PlaceholderTable({ title = 'Table' }: PlaceholderTableProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-[var(--color-text-muted)] text-sm">
      {title} — plug in data table here
    </div>
  );
}
