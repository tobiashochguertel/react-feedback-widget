/**
 * Storage Service Barrel File
 *
 * @packageDocumentation
 */

// Interfaces
export type { StorageService, AsyncStorageService } from './StorageService';
export type {
  VideoStorageService,
  VideoRecord,
  VideoStorageOptions,
} from './VideoStorageService';

// Storage Service Implementations (I005)
export { LocalStorageService } from './LocalStorageService';
export { InMemoryStorageService } from './InMemoryStorageService';

// Video Storage Service Implementations (I005)
export { IndexedDBVideoStorageService } from './IndexedDBVideoStorageService';
export { InMemoryVideoStorageService } from './InMemoryVideoStorageService';
