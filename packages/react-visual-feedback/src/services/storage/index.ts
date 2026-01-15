/**
 * Storage Service Barrel File
 *
 * @packageDocumentation
 */

export type { StorageService, AsyncStorageService } from './StorageService';
export type {
  VideoStorageService,
  VideoRecord,
  VideoStorageOptions,
} from './VideoStorageService';

// Implementations will be added in I005:
// export { LocalStorageService } from './LocalStorageService';
// export { InMemoryStorageService } from './InMemoryStorageService';
// export { IndexedDBVideoStorageService } from './IndexedDBVideoStorageService';
