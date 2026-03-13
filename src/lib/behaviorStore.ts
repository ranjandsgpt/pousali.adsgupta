/**
 * Behavioral event store (IndexedDB). Stores event name, context, sessionId, timestamp, auditProfile (buckets only).
 * Retention: 90 days. Auto-purge on write.
 */

const DB_NAME = 'audit_behavior_db';
const STORE_NAME = 'events';
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

export interface AuditProfileBucket {
  healthScoreBucket: 'low' | 'mid' | 'high';
  spendBucket: '<1k' | '1k-10k' | '10k-50k' | '50k+';
  reportTypes: string[];
}

export interface BehaviorEvent {
  id?: number;
  event: string;
  context?: string;
  sessionId: string;
  timestamp: number;
  auditProfile?: AuditProfileBucket;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('sessionId', 'sessionId', { unique: false });
      }
    };
  });
}

async function purgeOld(): Promise<void> {
  const cutoff = Date.now() - RETENTION_MS;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const idx = store.index('timestamp');
    const range = IDBKeyRange.upperBound(cutoff);
    const req = idx.openCursor(range);
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export const BehaviorStore = {
  async add(event: Omit<BehaviorEvent, 'id' | 'timestamp'>): Promise<void> {
    const db = await openDb();
    const record: BehaviorEvent = {
      ...event,
      timestamp: Date.now(),
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.add(record);
      tx.oncomplete = () => {
        db.close();
        purgeOld().then(resolve).catch(resolve);
      };
      tx.onerror = () => reject(tx.error);
    });
  },

  async getRecent(limit = 100): Promise<BehaviorEvent[]> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const idx = store.index('timestamp');
      const req = idx.openCursor(null, 'prev');
      const results: BehaviorEvent[] = [];
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value as BehaviorEvent);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  },

  async count(): Promise<number> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  },
};

export function createSessionId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
