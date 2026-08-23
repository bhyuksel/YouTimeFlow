const DB_NAME = 'YoutimeflowAudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'sounds';

export interface AudioItem {
  id: string;
  name: string;
  data: string; // base64
  createdAt: number;
}

export interface AudioItemInfo {
  id: string;
  name: string;
  createdAt: number;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveSound = async (id: string, name: string, data: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const item: AudioItem = {
      id,
      name,
      data,
      createdAt: Date.now()
    };
    
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAllSoundsInfo = async (): Promise<AudioItemInfo[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const results: AudioItem[] = request.result;
      const infoList = results.map(r => ({ id: r.id, name: r.name, createdAt: r.createdAt }));
      infoList.sort((a, b) => b.createdAt - a.createdAt); // newest first
      resolve(infoList);
    };
    request.onerror = () => reject(request.error);
  });
};

export const getSoundData = async (id: string): Promise<string | null> => {
  if (id === 'default') return null; // Default sound has no data here
  
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result.data);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteSound = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
