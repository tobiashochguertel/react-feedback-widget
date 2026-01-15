/**
 * Screenshot Service Barrel File
 *
 * @packageDocumentation
 */

export type {
  ScreenshotService,
  ScreenshotOptions,
  ScreenshotResult,
  SelectionArea,
} from './ScreenshotService';

// Implementations (I007)
export { ModernScreenshotService } from './ModernScreenshotService';
export { MockScreenshotService } from './MockScreenshotService';
