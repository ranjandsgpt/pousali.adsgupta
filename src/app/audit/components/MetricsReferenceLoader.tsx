'use client';

import { useEffect, useRef } from 'react';
import { loadReferenceFromCsv } from '@/lib/amazonMetricsReference';

/** Loads the 510-metric CSV reference from /metrics-reference.csv once. Reference is used for validation and AI context only (not primary computation). */
export default function MetricsReferenceLoader() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    fetch('/metrics-reference.csv')
      .then((r) => r.text())
      .then((csvText) => {
        const count = loadReferenceFromCsv(csvText);
        if (count > 0 && process.env.NODE_ENV === 'development') {
          console.debug(`[MetricsReference] Loaded ${count} reference formulas from CSV`);
        }
      })
      .catch(() => {
        // CSV optional; system continues with built-in formulas
      });
  }, []);

  return null;
}
