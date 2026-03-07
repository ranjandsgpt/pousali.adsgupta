'use client';

import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { validateFileLimits, getTotalBytes } from '../utils/fileLimits';
import { MAX_FILES } from '../utils/constants';

interface UploadPanelProps {
  onUploadComplete?: (files: File[]) => void;
  disabled?: boolean;
  /** Phase 8: When true, show collapsed view (file icons + remove only), ~70% height reduction. */
  collapsed?: boolean;
}

export default function UploadPanel({
  onUploadComplete,
  disabled = false,
  collapsed = false,
}: UploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [limitError, setLimitError] = useState<string | null>(null);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      if (newFiles.length === 0) return;
      setLimitError(null);
      const currentBytes = getTotalBytes(files);
      const currentCount = files.length;
      const result = validateFileLimits(currentCount, currentBytes, newFiles);
      if (!result.ok) {
        setLimitError(result.message ?? 'Upload limit exceeded.');
        return;
      }
      const combined = [...files, ...newFiles];
      if (combined.length > MAX_FILES) {
        setLimitError(`Maximum ${MAX_FILES} files allowed.`);
        return;
      }
      setFiles(combined);
      onUploadComplete?.(combined);
    },
    [files, onUploadComplete]
  );

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
        (f) =>
          f.name.endsWith('.csv') ||
          f.type === 'text/csv' ||
          /\.(xlsx|xls)$/i.test(f.name)
      );
      addFiles(dropped);
    },
    [disabled, addFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? []).filter(
        (f) =>
          f.name.endsWith('.csv') ||
          f.type === 'text/csv' ||
          /\.(xlsx|xls)$/i.test(f.name)
      );
      addFiles(selected);
      e.target.value = '';
    },
    [addFiles]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setLimitError(null);
      return next;
    });
  }, []);

  if (collapsed && files.length > 0) {
    return (
      <section
        aria-labelledby="upload-heading"
        className="rounded-xl border border-dashed border-white/20 bg-[var(--color-surface-elevated)] px-3 py-2 transition-colors"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span id="upload-heading" className="text-xs font-medium text-[var(--color-text-muted)] shrink-0">
            Uploaded
          </span>
          <ul className="flex flex-wrap gap-1.5 overflow-x-auto max-w-full" role="list">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${f.size}-${i}`}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 text-xs text-[var(--color-text)] shrink-0"
              >
                <FileSpreadsheet size={14} className="text-cyan-500 shrink-0" aria-hidden />
                <span className="truncate max-w-[120px]" title={f.name}>{f.name}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-[var(--color-text-muted)] hover:text-red-400 focus:outline-none rounded"
                    aria-label={`Remove ${f.name}`}
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="upload-heading"
      className="rounded-2xl border border-dashed border-white/20 bg-[var(--color-surface-elevated)] p-8 transition-colors"
    >
      <h2 id="upload-heading" className="text-lg font-semibold text-[var(--color-text)] mb-4">
        Upload Reports
      </h2>
      {limitError && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-3 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-amber-700 dark:text-amber-400 text-sm"
        >
          <AlertCircle size={20} aria-hidden />
          {limitError}
        </div>
      )}
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
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          multiple
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Select CSV or Excel report files (max 10 files, 50MB total)"
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
          Business Report, SP, SB, SD. CSV, XLSX, or XLS. Max 10 files, 50MB total.
        </p>
      </div>
      {files.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" role="list">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${f.size}-${i}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-sm text-[var(--color-text)]"
            >
              <FileSpreadsheet size={16} className="text-cyan-500 shrink-0" aria-hidden />
              <span className="truncate max-w-[200px]" title={f.name}>{f.name}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-[var(--color-text-muted)] hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
                  aria-label={`Remove ${f.name}`}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
