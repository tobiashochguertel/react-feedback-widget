/**
 * In-Memory Video Storage Service Implementation
 *
 * Implements VideoStorageService interface using an in-memory Map.
 * Ideal for testing and environments without IndexedDB.
 *
 * @packageDocumentation
 */

import type {
  VideoStorageService,
  VideoRecord,
  VideoStorageOptions,
} from './VideoStorageService';

/**
 * Video storage service implementation using in-memory Map
 *
 * This implementation is useful for:
 * - Unit testing without IndexedDB mocks
 * - Server-side rendering scenarios
 * - Development and debugging
 *
 * @example
 * ```typescript
 * const videoStorage = new InMemoryVideoStorageService();
 * await videoStorage.save('video1', videoBlob, { duration: 30 });
 * const blob = await videoStorage.get('video1');
 * ```
 */
export class InMemoryVideoStorageService implements VideoStorageService {
  private storage: Map<string, VideoRecord> = new Map();

  /**
   * Store a video blob
   */
  async save(
    id: string,
    blob: Blob,
    options?: VideoStorageOptions
  ): Promise<boolean> {
    try {
      const record: VideoRecord = {
        id,
        blob,
        timestamp: options?.timestamp ?? Date.now(),
        mimeType: blob.type,
        size: blob.size,
        ...(options?.duration !== undefined && { duration: options.duration }),
      };

      this.storage.set(id, record);
      return true;
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
    return this.storage.get(id) ?? null;
  }

  /**
   * Delete a video by ID
   */
  async delete(id: string): Promise<boolean> {
    return this.storage.delete(id);
  }

  /**
   * Check if a video exists
   */
  async exists(id: string): Promise<boolean> {
    return this.storage.has(id);
  }

  /**
   * Get all video IDs
   */
  async listIds(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }

  /**
   * Clear all stored videos
   */
  async clear(): Promise<boolean> {
    this.storage.clear();
    return true;
  }

  /**
   * Get total storage size in bytes
   */
  async getStorageSize(): Promise<number> {
    let totalSize = 0;
    for (const record of this.storage.values()) {
      totalSize += record.size ?? record.blob.size;
    }
    return totalSize;
  }

  /**
   * Get the number of stored videos (useful for testing)
   */
  get size(): number {
    return this.storage.size;
  }
}
