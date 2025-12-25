/**
 * DB.TS - High-Performance Binary Storage Service
 * Utilizes IndexedDB to store raw media assets (Base64/Blobs),
 * saved reels, themes, and app state for full persistence.
 */

import { SavedReel, ThemeConfig } from '../types';

const DB_NAME = 'StudioOS_Asset_Vault';
const DB_VERSION = 2; // Bumped for new stores

// Store names
const MEDIA_STORE = 'media_blobs';
const REELS_STORE = 'saved_reels';
const THEMES_STORE = 'saved_themes';

export class AssetDB {
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Media blobs store (existing)
        if (!db.objectStoreNames.contains(MEDIA_STORE)) {
          db.createObjectStore(MEDIA_STORE);
        }

        // Reels store (new)
        if (!db.objectStoreNames.contains(REELS_STORE)) {
          db.createObjectStore(REELS_STORE, { keyPath: 'id' });
        }

        // Themes store (new)
        if (!db.objectStoreNames.contains(THEMES_STORE)) {
          db.createObjectStore(THEMES_STORE, { keyPath: 'id' });
        }
      };

      request.onsuccess = event => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = event => {
        console.error('IDB Initialization Failed', event);
        reject(event);
      };
    });
  }

  // ============ MEDIA BLOBS ============

  async save(id: string, data: string | Blob): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MEDIA_STORE], 'readwrite');
      const store = transaction.objectStore(MEDIA_STORE);
      const request = store.put(data, id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(id: string): Promise<string | Blob | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MEDIA_STORE], 'readonly');
      const store = transaction.objectStore(MEDIA_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MEDIA_STORE], 'readwrite');
      const store = transaction.objectStore(MEDIA_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction([MEDIA_STORE], 'readwrite');
    transaction.objectStore(MEDIA_STORE).clear();
  }

  // ============ SAVED REELS ============

  async saveReel(reel: SavedReel): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([REELS_STORE], 'readwrite');
      const store = transaction.objectStore(REELS_STORE);
      const request = store.put(reel);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllReels(): Promise<SavedReel[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([REELS_STORE], 'readonly');
      const store = transaction.objectStore(REELS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteReel(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([REELS_STORE], 'readwrite');
      const store = transaction.objectStore(REELS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============ SAVED THEMES ============

  async saveTheme(theme: ThemeConfig): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([THEMES_STORE], 'readwrite');
      const store = transaction.objectStore(THEMES_STORE);
      const request = store.put(theme);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllThemes(): Promise<ThemeConfig[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([THEMES_STORE], 'readonly');
      const store = transaction.objectStore(THEMES_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteTheme(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([THEMES_STORE], 'readwrite');
      const store = transaction.objectStore(THEMES_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const assetDB = new AssetDB();
