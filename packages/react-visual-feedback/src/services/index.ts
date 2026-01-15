/**
 * React Visual Feedback - Services
 *
 * Service layer providing abstractions over browser APIs and external services.
 * Implements the Dependency Inversion Principle for testability.
 *
 * @packageDocumentation
 */

// Storage services
export type {
  StorageService,
  AsyncStorageService,
} from './storage/StorageService';
export type {
  VideoStorageService,
  VideoRecord,
  VideoStorageOptions,
} from './storage/VideoStorageService';

// Recording services
export type {
  RecorderService,
  RecordingState,
  RecordingOptions,
  RecordingResult,
  RecordingProgress,
} from './recording/RecorderService';

// Screenshot services
export type {
  ScreenshotService,
  ScreenshotOptions,
  ScreenshotResult,
  SelectionArea,
} from './screenshot/ScreenshotService';

// Implementations will be added in I005, I006, I007:
// export { LocalStorageService } from './storage/LocalStorageService';
// export { InMemoryStorageService } from './storage/InMemoryStorageService';
// export { IndexedDBVideoStorageService } from './storage/IndexedDBVideoStorageService';
// export { MediaRecorderService } from './recording/MediaRecorderService';
// export { ModernScreenshotService } from './screenshot/ModernScreenshotService';
