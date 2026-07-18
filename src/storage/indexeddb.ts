const DATABASE_NAME = 'gem-auto-flow-db';
const DATABASE_VERSION = 1;
const STORE_NAMES = {
  stageResults: 'stage-results',
  jobResults: 'job-results',
  payloads: 'payloads',
} as const;

export type IndexedDbStoreName = (typeof STORE_NAMES)[keyof typeof STORE_NAMES];

class IndexedDbClient {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private open(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        Object.values(STORE_NAMES).forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Unable to open IndexedDB.'));
    });

    return this.dbPromise;
  }

  async put<T extends { id: string }>(storeName: IndexedDbStoreName, value: T): Promise<void> {
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed.'));
    });
  }

  async get<T>(storeName: IndexedDbStoreName, id: string): Promise<T | null> {
    const db = await this.open();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).get(id);
      request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed.'));
    });
  }

  async getAll<T>(storeName: IndexedDbStoreName): Promise<T[]> {
    const db = await this.open();
    return await new Promise<T[]>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).getAll();
      request.onsuccess = () => resolve((request.result as T[] | undefined) ?? []);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB read all failed.'));
    });
  }

  async delete(storeName: IndexedDbStoreName, id: string): Promise<void> {
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed.'));
    });
  }
}

export const indexedDbClient = new IndexedDbClient();
export { STORE_NAMES };
