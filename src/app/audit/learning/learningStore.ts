/**
 * Local persistence for Continuous Learning — IndexedDB.
 * Only anonymized patterns and aggregates. No raw client data.
 */

import type { LearningDB } from './types';
import { LEARNING_DB_KEY, LEARNING_DB_VERSION, LEARNING_STORE_NAME } from './types';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const req = indexedDB.open('AuditLearningDB', LEARNING_DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(LEARNING_STORE_NAME)) {
        db.createObjectStore(LEARNING_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export function createEmptyLearningDB(): LearningDB {
  const now = Date.now();
  return {
    keywordPatterns: [],
    campaignPatterns: [],
    wastePatterns: [],
    growthPatterns: [],
    accountBenchmarks: null,
    recommendationRecords: [],
    accountsAnalyzed: 0,
    patternsDiscovered: 0,
    wastePatternsDetected: 0,
    growthPatternsDetected: 0,
    updatedAt: now,
  };
}

export async function loadLearningDB(): Promise<LearningDB> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(LEARNING_STORE_NAME, 'readonly');
      const store = tx.objectStore(LEARNING_STORE_NAME);
      const req = store.get(LEARNING_DB_KEY);
      req.onsuccess = () => {
        db.close();
        const raw = req.result?.data;
        if (raw && typeof raw === 'object') {
          resolve({ ...createEmptyLearningDB(), ...raw } as LearningDB);
        } else {
          resolve(createEmptyLearningDB());
        }
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return createEmptyLearningDB();
  }
}

export async function saveLearningDB(data: LearningDB): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(LEARNING_STORE_NAME, 'readwrite');
      const store = tx.objectStore(LEARNING_STORE_NAME);
      store.put({ id: LEARNING_DB_KEY, data: { ...data, updatedAt: Date.now() } });
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    // Persist in memory only if IndexedDB fails
  }
}
