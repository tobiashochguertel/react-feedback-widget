/**
 * Persistence Services Module
 *
 * Factory functions and exports for the Data Persistence API.
 * Provides export/import functionality for feedback bundles.
 *
 * @packageDocumentation
 */

// Re-export types
export type {
  SerializedVideo,
  BundleMetadata,
  FeedbackBundle,
  ExportOptions,
  ImportOptions,
  ImportResult,
  ExportService,
  ImportService,
  PersistenceServices,
} from './types';

export { BUNDLE_VERSION, BUNDLE_SOURCE, MAX_FEEDBACK_ITEMS } from './types';

// Re-export serialization utilities
export {
  serializeBlob,
  deserializeBlob,
  createBundle,
  parseBundle,
  validateBundle,
  stringifyBundle,
} from './BundleSerializer';

// Re-export service factories
export { createExportService } from './ExportService';
export type { ExportServiceDeps } from './ExportService';

export { createImportService } from './ImportService';
export type { ImportServiceDeps } from './ImportService';

// Import for factory
import type { FeedbackData } from '../../types';
import type { StorageService } from '../storage/StorageService';
import type { VideoStorageService } from '../storage/VideoStorageService';
import type { PersistenceServices } from './types';
import { createExportService } from './ExportService';
import { createImportService } from './ImportService';
import { LocalStorageService } from '../storage/LocalStorageService';
import { IndexedDBVideoStorageService } from '../storage/IndexedDBVideoStorageService';
import { STORAGE } from '../../constants/storage';

/**
 * Configuration for PersistenceFactory
 */
export interface PersistenceConfig {
  /** Custom storage service for feedback data */
  storageService?: StorageService<FeedbackData[]>;
  /** Custom video storage service */
  videoService?: VideoStorageService;
}

/**
 * Create persistence services for production use
 *
 * Uses LocalStorageService and IndexedDBVideoStorageService by default.
 *
 * @param config - Optional configuration overrides
 * @returns PersistenceServices instance
 *
 * @example
 * ```typescript
 * const persistence = createPersistenceServices();
 *
 * // Export all feedback
 * const bundle = await persistence.exportService.exportToBundle();
 *
 * // Import from file
 * const result = await persistence.importService.importFromFile(file);
 * ```
 */
export function createPersistenceServices(config: PersistenceConfig = {}): PersistenceServices {
  const storageService = config.storageService || new LocalStorageService<FeedbackData[]>();
  const videoService = config.videoService || new IndexedDBVideoStorageService(
    STORAGE.VIDEO_DB_NAME,
    STORAGE.VIDEO_STORE_NAME
  );

  return {
    exportService: createExportService({ storageService, videoService }),
    importService: createImportService({ storageService, videoService }),
  };
}

/**
 * In-memory storage service for testing
 */
class InMemoryStorageService<T> implements StorageService<T> {
  private store = new Map<string, T>();

  get(key: string): T | null {
    return this.store.get(key) ?? null;
  }

  set(key: string, value: T): boolean {
    this.store.set(key, value);
    return true;
  }

  remove(key: string): boolean {
    return this.store.delete(key);
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  clear(): boolean {
    this.store.clear();
    return true;
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }
}

/**
 * Internal record type for in-memory video storage
 */
interface InMemoryVideoRecord {
  blob: Blob;
  timestamp: number;
  duration?: number;
  mimeType?: string;
}

/**
 * In-memory video storage service for testing
 */
class InMemoryVideoStorageService implements VideoStorageService {
  private store = new Map<string, InMemoryVideoRecord>();
  private totalSize = 0;

  async save(id: string, blob: Blob, options?: { duration?: number }): Promise<boolean> {
    // Remove old size if replacing
    const existing = this.store.get(id);
    if (existing) {
      this.totalSize -= existing.blob.size;
    }

    const record: InMemoryVideoRecord = {
      blob,
      timestamp: Date.now(),
    };
    if (options?.duration !== undefined) {
      record.duration = options.duration;
    }
    if (blob.type) {
      record.mimeType = blob.type;
    }

    this.store.set(id, record);
    this.totalSize += blob.size;
    return true;
  }

  async get(id: string): Promise<Blob | null> {
    const record = this.store.get(id);
    return record?.blob ?? null;
  }

  async getRecord(id: string): Promise<{
    id: string;
    blob: Blob;
    timestamp: number;
    duration?: number;
    mimeType?: string;
    size?: number;
  } | null> {
    const record = this.store.get(id);
    if (!record) return null;

    const result: {
      id: string;
      blob: Blob;
      timestamp: number;
      duration?: number;
      mimeType?: string;
      size?: number;
    } = {
      id,
      blob: record.blob,
      timestamp: record.timestamp,
      size: record.blob.size,
    };
    if (record.duration !== undefined) {
      result.duration = record.duration;
    }
    if (record.mimeType !== undefined) {
      result.mimeType = record.mimeType;
    }
    return result;
  }

  async delete(id: string): Promise<boolean> {
    const record = this.store.get(id);
    if (record) {
      this.totalSize -= record.blob.size;
    }
    return this.store.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.store.has(id);
  }

  async listIds(): Promise<string[]> {
    return Array.from(this.store.keys());
  }

  async clear(): Promise<boolean> {
    this.store.clear();
    this.totalSize = 0;
    return true;
  }

  async getStorageSize(): Promise<number> {
    return this.totalSize;
  }
}

/**
 * Test utilities for persistence services
 */
export interface TestPersistenceServices extends PersistenceServices {
  /** In-memory storage for test assertions */
  storageService: StorageService<FeedbackData[]>;
  /** In-memory video storage for test assertions */
  videoService: VideoStorageService;
  /** Helper to seed test data */
  seedTestData(feedback: FeedbackData[], videos?: Map<string, Blob>): Promise<void>;
  /** Helper to clear all test data */
  clearTestData(): Promise<void>;
}

/**
 * Create persistence services for testing
 *
 * Uses in-memory storage for isolation between tests.
 *
 * @returns TestPersistenceServices instance with helpers
 *
 * @example
 * ```typescript
 * const testPersistence = createTestPersistenceServices();
 *
 * // Seed test data
 * await testPersistence.seedTestData(mockFeedback, mockVideos);
 *
 * // Run tests...
 *
 * // Clean up
 * await testPersistence.clearTestData();
 * ```
 */
export function createTestPersistenceServices(): TestPersistenceServices {
  const storageService = new InMemoryStorageService<FeedbackData[]>();
  const videoService = new InMemoryVideoStorageService();

  return {
    exportService: createExportService({ storageService, videoService }),
    importService: createImportService({ storageService, videoService }),
    storageService,
    videoService,
    async seedTestData(feedback: FeedbackData[], videos?: Map<string, Blob>): Promise<void> {
      storageService.set(STORAGE.FEEDBACK_KEY, feedback);

      if (videos) {
        for (const [id, blob] of videos) {
          await videoService.save(id, blob);
        }
      }
    },
    async clearTestData(): Promise<void> {
      storageService.clear();
      await videoService.clear();
    },
  };
}
