import { toast } from 'sonner';

import { MUTATIONS_STORE, openArenaMutationDb } from './db';
import type { ArenaMutation, ArenaMutationRow } from './types';

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  for (const l of [...listeners]) {
    try {
      l();
    } catch {
      listeners.delete(l);
    }
  }
}

export function subscribeQueue(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let memoryRows: Array<ArenaMutationRow> = [];
let memoryId = 1;
let memoryFallback = false;

export function _resetQueueForTests() {
  memoryRows = [];
  memoryId = 1;
  memoryFallback = true;
  listeners.clear();
}

export function _restoreQueueAfterTests() {
  memoryRows = [];
  memoryId = 1;
  memoryFallback = false;
  listeners.clear();
}

function rowsFromMemory() {
  return [...memoryRows].sort((a, b) => a.id - b.id);
}

export async function enqueue(mutation: ArenaMutation): Promise<number> {
  const base = {
    kind: mutation.kind,
    payload: mutation.payload,
    createdAt: Date.now(),
    attempts: 0,
  };

  if (memoryFallback) {
    const id = memoryId++;
    memoryRows.push({ ...base, id });
    notify();
    return id;
  }

  try {
    const db = await openArenaMutationDb();
    return await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(MUTATIONS_STORE, 'readwrite');
      const store = tx.objectStore(MUTATIONS_STORE);
      const req = store.add(base);

      req.onsuccess = () => {
        notify();
        resolve(req.result as number);
      };

      req.onerror = () => {
        reject(req.error ?? new Error('enqueue failed'));
      };
    });
  } catch {
    if (!memoryFallback) {
      toast.warning('Offline queue using memory only', {
        description:
          'IndexedDB unavailable; queued mutations may be lost if you close the tab.',
      });
      memoryFallback = true;
    }
    const id = memoryId++;
    memoryRows.push({ ...base, id });
    notify();
    return id;
  }
}

export async function countPending(): Promise<number> {
  if (memoryFallback) {
    return memoryRows.length;
  }
  try {
    const db = await openArenaMutationDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(MUTATIONS_STORE, 'readonly');
      const store = tx.objectStore(MUTATIONS_STORE);
      const req = store.count();

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return memoryRows.length;
  }
}

export async function peekOrdered(): Promise<Array<ArenaMutationRow>> {
  if (memoryFallback) {
    return rowsFromMemory();
  }
  try {
    const db = await openArenaMutationDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(MUTATIONS_STORE, 'readonly');
      const store = tx.objectStore(MUTATIONS_STORE);
      const req = store.openCursor();
      const rows: Array<ArenaMutationRow> = [];

      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          rows.push(cursor.value as ArenaMutationRow);
          cursor.continue();
        } else {
          resolve(rows);
        }
      };

      req.onerror = () => reject(req.error);
    });
  } catch {
    return rowsFromMemory();
  }
}

export async function deleteById(id: number): Promise<void> {
  if (memoryFallback) {
    memoryRows = memoryRows.filter((r) => r.id !== id);
    notify();
    return;
  }
  const db = await openArenaMutationDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(MUTATIONS_STORE, 'readwrite');
    const store = tx.objectStore(MUTATIONS_STORE);
    const req = store.delete(id);

    req.onsuccess = () => {
      notify();
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function incrementAttempts(id: number): Promise<void> {
  if (memoryFallback) {
    const row = memoryRows.find((r) => r.id === id);
    if (row) {
      row.attempts += 1;
    }
    notify();
    return;
  }
  const db = await openArenaMutationDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(MUTATIONS_STORE, 'readwrite');
    const store = tx.objectStore(MUTATIONS_STORE);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const v = getReq.result as ArenaMutationRow | undefined;
      if (!v) {
        resolve();
        return;
      }
      const putReq = store.put({ ...v, attempts: v.attempts + 1 });
      putReq.onsuccess = () => {
        notify();
        resolve();
      };
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}
