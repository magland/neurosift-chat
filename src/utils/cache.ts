interface CacheData<T> {
  timestamp: number;
  result: T;
}

const DB_NAME = 'DandiExplorerCache';
const STORE_NAME = 'cache';
const DB_VERSION = 1;

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

function createCacheKey(name: string, version: string, args: unknown[]): string {
  return `${name}:${version}:${JSON.stringify(args)}`;
}

export async function getCachedResult<T>(
  name: string,
  version: string,
  args: unknown[],
  expireMinutes: number
): Promise<T | null> {
  const db = await openDB();
  const key = createCacheKey(name, version, args);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onerror = () => {
      db.close();
      reject(request.error);
    };

    request.onsuccess = () => {
      db.close();
      const cached = request.result as CacheData<T> | undefined;

      if (!cached) {
        resolve(null);
        return;
      }

      const now = Date.now();
      if (now - cached.timestamp < expireMinutes * 60 * 1000) {
        resolve(cached.result);
      } else {
        resolve(null);
      }
    };
  });
}

export async function setCachedResult<T>(
  name: string,
  version: string,
  args: unknown[],
  result: T
): Promise<void> {
  const db = await openDB();
  const key = createCacheKey(name, version, args);
  const cacheData: CacheData<T> = {
    timestamp: Date.now(),
    result
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(cacheData, key);

    request.onerror = () => {
      db.close();
      reject(request.error);
    };

    request.onsuccess = () => {
      db.close();
      resolve();
    };
  });
}
