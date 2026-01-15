/**
 * IndexedDB Video Storage Service Implementation
 *
 * Implements VideoStorageService interface using browser IndexedDB.
 * Optimized for storing large video blobs with efficient retrieval.
 *
 * @packageDocumentation
 */

import type {
  VideoStorageService,
  VideoRecord,
  VideoStorageOptions,
} from './VideoStorageService';
import { STORAGE } from '../../constants';

/**
 * Video storage service implementation using IndexedDB
 *
 * IndexedDB is preferred for video storage because:
 * - Supports large binary objects (blobs)
 * - Higher storage limits than localStorage
 * - Async API doesn't block the main thread
 *
 * @example
 * ```typescript
 * const videoStorage = new IndexedDBVideoStorageService();
 * await videoStorage.save('video1', videoBlob, { duration: 30 });
 * const blob = await videoStorage.get('video1');
 * ```
 */
export class IndexedDBVideoStorageService implements VideoStorageService {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private storeName: string;
  private initPromise: Promise<void> | null = null;

  /**
   * Create a new IndexedDBVideoStorageService
   *
   * @param dbName - Database name (default: from STORAGE constants)
   * @param storeName - Object store name (default: from STORAGE constants)
   */
  constructor(
    dbName: string = STORAGE.VIDEO_DB_NAME,
    storeName: string = STORAGE.VIDEO_STORE_NAME
  ) {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  /**
   * Initialize the database connection
   * Called automatically on first operation
   */
  private async ensureDatabase(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.initPromise) {
      await this.initPromise;
      if (this.db) return this.db;
    }

    this.initPromise = this.openDatabase();
    await this.initPromise;

    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }

    return this.db;
  }

  /**
   * Open or create the database
   */
  private openDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not available'));
        return;
      }

      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Store a video blob
   */
  async save(
    id: string,
    blob: Blob,
    options?: VideoStorageOptions
  ): Promise<boolean> {
    try {
      const db = await this.ensureDatabase();

      const record: VideoRecord = {
        id,
        blob,
        timestamp: options?.timestamp ?? Date.now(),
        mimeType: blob.type,
        size: blob.size,
        ...(options?.duration !== undefined && { duration: options.duration }),
      };

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(record);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return false;
    }
  }

  /**
   * Retrieve a video blob by ID
   */
  async get(id: string): Promise<Blob | null> {
    const record = await this.getRecord(id);
    return record?.blob ?? null;
  }

  /**
   * Retrieve full video record by ID
   */
  async getRecord(id: string): Promise<VideoRecord | null> {
    try {
      const db = await this.ensureDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(id);

        request.onsuccess = () => {
          resolve(request.result || null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  }

  /**
   * Delete a video by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      const db = await this.ensureDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return false;
    }
  }

  /**
   * Check if a video exists
   */
  async exists(id: string): Promise<boolean> {
    const record = await this.getRecord(id);
    return record !== null;
  }

  /**
   * Get all video IDs
   */
  async listIds(): Promise<string[]> {
    try {
      const db = await this.ensureDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAllKeys();

        request.onsuccess = () => {
          resolve(request.result.map(String));
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  }

  /**
   * Clear all stored videos
   */
  async clear(): Promise<boolean> {
    try {
      const db = await this.ensureDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return false;
    }
  }

  /**
   * Get total storage size in bytes
   */
  async getStorageSize(): Promise<number> {
    try {
      const db = await this.ensureDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          const records = request.result as VideoRecord[];
          const totalSize = records.reduce(
            (sum, record) => sum + (record.size ?? record.blob.size),
            0
          );
          resolve(totalSize);
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return 0;
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initPromise = null;
  }
}
