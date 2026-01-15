/**
 * Service Factory
 *
 * Factory pattern for creating service instances with dependency injection support.
 * Provides both production and test configurations.
 *
 * @module services/ServiceFactory
 */

import type { StorageService } from './storage/StorageService';
import type { VideoStorageService } from './storage/VideoStorageService';
import type { RecorderService } from './recording/RecorderService';
import type { ScreenshotService } from './screenshot/ScreenshotService';

/**
 * Service container interface
 * Defines all services that can be injected into the application
 */
export interface ServiceContainer {
  /** General key-value storage service (localStorage wrapper) */
  storage: StorageService;
  /** Video blob storage service (IndexedDB for videos) */
  videoStorage: VideoStorageService;
  /** Screen recording service */
  recorder: RecorderService;
  /** Screenshot capture service */
  screenshot: ScreenshotService;
}

/**
 * Partial service container for dependency injection
 * Allows overriding specific services while using defaults for others
 */
export type PartialServiceContainer = Partial<ServiceContainer>;

/**
 * Service factory configuration
 */
export interface ServiceFactoryConfig {
  /** Optional key prefix for storage service */
  storagePrefix?: string;
  /** Optional IndexedDB database name for video storage */
  videoDbName?: string;
  /** Optional IndexedDB store name for video storage */
  videoStoreName?: string;
}

/**
 * Create production service container
 *
 * Creates service instances using real browser APIs.
 * Lazy loads implementations to enable tree-shaking.
 *
 * @param config - Optional configuration for services
 * @param overrides - Optional service overrides for partial DI
 * @returns Promise resolving to complete service container
 *
 * @example
 * ```typescript
 * // Create with defaults
 * const services = await createProductionServices();
 *
 * // Create with custom storage prefix
 * const services = await createProductionServices({
 *   storagePrefix: 'myapp_'
 * });
 *
 * // Create with mock recorder for testing
 * const services = await createProductionServices({}, {
 *   recorder: mockRecorder
 * });
 * ```
 */
export async function createProductionServices(
  config: ServiceFactoryConfig = {},
  overrides: PartialServiceContainer = {}
): Promise<ServiceContainer> {
  // Lazy load implementations
  const [
    { LocalStorageService },
    { IndexedDBVideoStorageService },
    { MediaRecorderService },
    { ModernScreenshotService },
  ] = await Promise.all([
    import('./storage/LocalStorageService'),
    import('./storage/IndexedDBVideoStorageService'),
    import('./recording/MediaRecorderService'),
    import('./screenshot/ModernScreenshotService'),
  ]);

  return {
    storage: overrides.storage ?? new LocalStorageService(config.storagePrefix),
    videoStorage: overrides.videoStorage ?? new IndexedDBVideoStorageService(
      config.videoDbName,
      config.videoStoreName
    ),
    recorder: overrides.recorder ?? new MediaRecorderService(),
    screenshot: overrides.screenshot ?? new ModernScreenshotService(),
  };
}

/**
 * Create test/mock service container
 *
 * Creates service instances using in-memory implementations suitable for testing.
 * No browser APIs are required.
 *
 * @param overrides - Optional service overrides
 * @returns Promise resolving to complete service container
 *
 * @example
 * ```typescript
 * // Create test services
 * const services = await createTestServices();
 *
 * // Create with custom mock
 * const customMock = new MockRecorderService();
 * customMock.mockStop.mockResolvedValue({ blob: myBlob });
 * const services = await createTestServices({
 *   recorder: customMock
 * });
 * ```
 */
export async function createTestServices(
  overrides: PartialServiceContainer = {}
): Promise<ServiceContainer> {
  // Lazy load mock implementations
  const [
    { InMemoryStorageService },
    { InMemoryVideoStorageService },
    { MockRecorderService },
    { MockScreenshotService },
  ] = await Promise.all([
    import('./storage/InMemoryStorageService'),
    import('./storage/InMemoryVideoStorageService'),
    import('./recording/MockRecorderService'),
    import('./screenshot/MockScreenshotService'),
  ]);

  return {
    storage: overrides.storage ?? new InMemoryStorageService(),
    videoStorage: overrides.videoStorage ?? new InMemoryVideoStorageService(),
    recorder: overrides.recorder ?? new MockRecorderService(),
    screenshot: overrides.screenshot ?? new MockScreenshotService(),
  };
}

/**
 * Synchronous production service creation
 *
 * Creates service instances synchronously. Use this when async is not possible.
 * Note: This requires all implementations to be bundled (no tree-shaking benefit).
 *
 * @param config - Optional configuration for services
 * @param overrides - Optional service overrides for partial DI
 * @returns Complete service container
 */
export function createProductionServicesSync(
  config: ServiceFactoryConfig = {},
  overrides: PartialServiceContainer = {}
): ServiceContainer {
  // Synchronous imports - these will be bundled
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { LocalStorageService } = require('./storage/LocalStorageService');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { IndexedDBVideoStorageService } = require('./storage/IndexedDBVideoStorageService');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MediaRecorderService } = require('./recording/MediaRecorderService');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ModernScreenshotService } = require('./screenshot/ModernScreenshotService');

  return {
    storage: overrides.storage ?? new LocalStorageService(config.storagePrefix),
    videoStorage: overrides.videoStorage ?? new IndexedDBVideoStorageService(
      config.videoDbName,
      config.videoStoreName
    ),
    recorder: overrides.recorder ?? new MediaRecorderService(),
    screenshot: overrides.screenshot ?? new ModernScreenshotService(),
  };
}

/**
 * Synchronous test service creation
 *
 * Creates mock service instances synchronously for testing.
 *
 * @param overrides - Optional service overrides
 * @returns Complete service container
 */
export function createTestServicesSync(
  overrides: PartialServiceContainer = {}
): ServiceContainer {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { InMemoryStorageService } = require('./storage/InMemoryStorageService');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { InMemoryVideoStorageService } = require('./storage/InMemoryVideoStorageService');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MockRecorderService } = require('./recording/MockRecorderService');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MockScreenshotService } = require('./screenshot/MockScreenshotService');

  return {
    storage: overrides.storage ?? new InMemoryStorageService(),
    videoStorage: overrides.videoStorage ?? new InMemoryVideoStorageService(),
    recorder: overrides.recorder ?? new MockRecorderService(),
    screenshot: overrides.screenshot ?? new MockScreenshotService(),
  };
}

/**
 * Default service container (lazy singleton)
 *
 * Provides a lazily-initialized default service container for simple use cases.
 * For more control, use createProductionServices or createTestServices directly.
 */
let defaultServices: ServiceContainer | null = null;

/**
 * Get or create the default service container
 *
 * @returns Promise resolving to the default service container
 */
export async function getDefaultServices(): Promise<ServiceContainer> {
  if (!defaultServices) {
    defaultServices = await createProductionServices();
  }
  return defaultServices;
}

/**
 * Reset the default service container
 *
 * Useful for testing to ensure fresh service instances.
 */
export function resetDefaultServices(): void {
  defaultServices = null;
}

/**
 * Check if running in a browser environment
 *
 * @returns true if running in browser, false otherwise
 */
export function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Check if required browser APIs are available
 *
 * @returns Object with availability status for each API
 */
export function checkBrowserApiAvailability(): {
  localStorage: boolean;
  indexedDB: boolean;
  mediaDevices: boolean;
  mediaRecorder: boolean;
} {
  return {
    localStorage: typeof localStorage !== 'undefined',
    indexedDB: typeof indexedDB !== 'undefined',
    mediaDevices: !!(navigator?.mediaDevices?.getDisplayMedia),
    mediaRecorder: typeof MediaRecorder !== 'undefined',
  };
}
