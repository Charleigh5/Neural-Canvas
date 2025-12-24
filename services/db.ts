
/**
 * DB.TS - High-Performance Binary Storage Service
 * Utilizes IndexedDB to store raw media assets (Base64/Blobs) 
 * preventing localStorage overflow and enabling large libraries.
 */

const DB_NAME = 'StudioOS_Asset_Vault';
const STORE_NAME = 'media_blobs';
const DB_VERSION = 1;

export class AssetDB {
    private db: IDBDatabase | null = null;

    private async getDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event: any) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };

            request.onsuccess = (event: any) => {
                this.db = event.target.result;
                resolve(this.db!);
            };

            request.onerror = (event: any) => {
                console.error('IDB Initialization Failed', event);
                reject(event);
            };
        });
    }

    /**
     * Stores a data URL or Blob in the vault.
     */
    async save(id: string, data: string | Blob): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(data, id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Retrieves an asset from the vault.
     */
    async get(id: string): Promise<string | Blob | null> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Purges an asset from the vault.
     */
    async delete(id: string): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clears all assets. Use with caution.
     */
    async clearAll(): Promise<void> {
        const db = await this.getDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        transaction.objectStore(STORE_NAME).clear();
    }
}

export const assetDB = new AssetDB();
