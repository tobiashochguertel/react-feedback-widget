/**
 * React Visual Feedback - Services
 *
 * Service layer providing abstractions over browser APIs and external services.
 * Implements the Dependency Inversion Principle for testability.
 *
 * @packageDocumentation
 */

// Storage services - interfaces
export type {
  StorageService,
  AsyncStorageService,
} from './storage/StorageService';
export type {
  VideoStorageService,
  VideoRecord,
  VideoStorageOptions,
} from './storage/VideoStorageService';

// Storage services - implementations
export { LocalStorageService } from './storage/LocalStorageService';
export { InMemoryStorageService } from './storage/InMemoryStorageService';
export { IndexedDBVideoStorageService } from './storage/IndexedDBVideoStorageService';
export { InMemoryVideoStorageService } from './storage/InMemoryVideoStorageService';

// Recording services - interfaces
export type {
  RecorderService,
  RecordingState,
  RecordingOptions,
  ServiceRecordingResult,
  RecordingProgress,
} from './recording/RecorderService';

// Re-export with legacy name for backwards compatibility
export type { ServiceRecordingResult as RecordingResult } from './recording/RecorderService';

// Recording services - implementations
export { MediaRecorderService } from './recording/MediaRecorderService';
export { MockRecorderService } from './recording/MockRecorderService';

// Screenshot services - interfaces
export type {
  ScreenshotService,
  ScreenshotOptions,
  ScreenshotResult,
  SelectionArea,
} from './screenshot/ScreenshotService';

// Screenshot services - implementations
export { ModernScreenshotService } from './screenshot/ModernScreenshotService';
export { MockScreenshotService } from './screenshot/MockScreenshotService';

// Service Factory
export type {
  ServiceContainer,
  PartialServiceContainer,
  ServiceFactoryConfig,
} from './ServiceFactory';
export {
  createProductionServices,
  createTestServices,
  createProductionServicesSync,
  createTestServicesSync,
  getDefaultServices,
  resetDefaultServices,
  isBrowserEnvironment,
  checkBrowserApiAvailability,
} from './ServiceFactory';
