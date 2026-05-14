const DB_NAME = 'tku-arena-mutations';
const DB_VERSION = 1;
export const MUTATIONS_STORE = 'mutations';

let dbPromise: Promise<IDBDatabase> | null = null;

export function openArenaMutationDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('indexedDB unavailable'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onerror = () => {
        dbPromise = null;
        reject(req.error ?? new Error('indexedDB open failed'));
      };

      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(MUTATIONS_STORE)) {
          const store = db.createObjectStore(MUTATIONS_STORE, {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      req.onsuccess = () => {
        resolve(req.result);
      };
    });
  }

  return dbPromise;
}

export function resetArenaMutationDbPromiseForTests() {
  dbPromise = null;
}
