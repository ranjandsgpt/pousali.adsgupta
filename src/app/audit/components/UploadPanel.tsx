'use client';

import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';

interface UploadPanelProps {
  onUploadComplete?: () => void;
  disabled?: boolean;
}

export default function UploadPanel({
  onUploadComplete,
  disabled = false,
}: UploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const dropped = Array.from(e.dataTransfer.files).filter(
        (f) => f.name.endsWith('.csv') || f.type === 'text/csv'
      );
      if (dropped.length) {
        setFiles((prev) => [...prev, ...dropped]);
        onUploadComplete?.();
      }
    },
    [disabled, onUploadComplete]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? []).filter(
        (f) => f.name.endsWith('.csv') || f.type === 'text/csv'
      );
      if (selected.length) {
        setFiles((prev) => [...prev, ...selected]);
        onUploadComplete?.();
      }
      e.target.value = '';
    },
    [onUploadComplete]
  );

  return (
    <section
      aria-labelledby="upload-heading"
      className="rounded-2xl border border-dashed border-white/20 bg-[var(--color-surface-elevated)] p-8 transition-colors"
    >
      <h2 id="upload-heading" className="text-lg font-semibold text-[var(--color-text)] mb-4">
        Upload Reports
      </h2>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative rounded-xl border-2 border-dashed p-12 text-center transition-colors
          ${isDragging ? 'border-cyan-500 bg-cyan-500/5' : 'border-white/20'}
          ${disabled ? 'pointer-events-none opacity-60' : 'cursor-pointer hover:border-cyan-500/50'}
        `}
      >
        <input
          type="file"
          accept=".csv,text/csv"
          multiple
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Select CSV report files"
        />
        <Upload
          className="mx-auto mb-4 text-[var(--color-text-muted)]"
          size={40}
          aria-hidden
        />
        <p className="text-[var(--color-text)] font-medium mb-1">
          Drag and drop Amazon CSV exports here
        </p>
        <p className="text-sm text-[var(--color-text-muted)]">
          or click to browse. Supports Business Report, Advertising, and other Seller Central exports.
        </p>
      </div>
      {files.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" role="list">
          {files.map((f) => (
            <li
              key={`${f.name}-${f.size}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-sm text-[var(--color-text)]"
            >
              <FileSpreadsheet size={16} className="text-cyan-500" aria-hidden />
              {f.name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
