/**
 * Recording Service Barrel File
 *
 * @packageDocumentation
 */

export type {
  RecorderService,
  RecordingState,
  RecordingOptions,
  RecordingResult,
  RecordingProgress,
} from './RecorderService';

// Implementations (I006)
export { MediaRecorderService } from './MediaRecorderService';
export { MockRecorderService } from './MockRecorderService';
