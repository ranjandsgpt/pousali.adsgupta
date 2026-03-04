/**
 * Section 22: Max files, max rows per file, max total size (50MB).
 */
import { MAX_FILES, MAX_TOTAL_BYTES } from './constants';

export type LimitError = 'too_many_files' | 'too_large';

export interface FileLimitResult {
  ok: boolean;
  error?: LimitError;
  message?: string;
}

/**
 * Validate that adding `newFiles` to `existingBytes` and `existingCount` stays within limits.
 */
export function validateFileLimits(
  existingCount: number,
  existingBytes: number,
  newFiles: File[]
): FileLimitResult {
  const totalCount = existingCount + newFiles.length;
  if (totalCount > MAX_FILES) {
    return {
      ok: false,
      error: 'too_many_files',
      message: `Maximum ${MAX_FILES} files allowed.`,
    };
  }

  const newBytes = newFiles.reduce((sum, f) => sum + f.size, 0);
  const totalBytes = existingBytes + newBytes;
  if (totalBytes > MAX_TOTAL_BYTES) {
    return {
      ok: false,
      error: 'too_large',
      message: 'File too large. Please upload reports under 50MB.',
    };
  }

  return { ok: true };
}

export function getTotalBytes(files: File[]): number {
  return files.reduce((sum, f) => sum + f.size, 0);
}
