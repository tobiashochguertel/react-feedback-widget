/**
 * Recording Service Barrel File
 *
 * @packageDocumentation
 */

export type {
  RecorderService,
  RecordingState,
  RecordingOptions,
  ServiceRecordingResult,
  RecordingProgress,
} from './RecorderService';

// Re-export with legacy name for backwards compatibility
export type { ServiceRecordingResult as RecordingResult } from './RecorderService';

// Implementations (I006)
export { MediaRecorderService } from './MediaRecorderService';
export { MockRecorderService } from './MockRecorderService';
