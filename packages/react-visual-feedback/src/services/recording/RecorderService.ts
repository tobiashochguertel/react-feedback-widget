/**
 * Recorder Service Interface
 *
 * Abstract interface for screen/video recording operations.
 * Implementations can use MediaRecorder, third-party libraries, etc.
 *
 * @packageDocumentation
 */

/**
 * Recording state enum
 */
export type RecordingState = 'idle' | 'preparing' | 'recording' | 'paused' | 'stopping' | 'completed' | 'error';

/**
 * Recording options
 */
export interface RecordingOptions {
  /** Video width in pixels */
  width?: number;
  /** Video height in pixels */
  height?: number;
  /** Frame rate (fps) */
  frameRate?: number;
  /** Video bitrate in bits per second */
  videoBitsPerSecond?: number;
  /** Audio bitrate in bits per second */
  audioBitsPerSecond?: number;
  /** MIME type for the recording */
  mimeType?: string;
  /** Whether to include audio */
  includeAudio?: boolean;
  /** Maximum recording duration in milliseconds */
  maxDuration?: number;
  /** Whether to include cursor in recording */
  includeCursor?: boolean;
  /** Whether to include system audio */
  includeSystemAudio?: boolean;
}

/**
 * Recording result after completion
 */
export interface RecordingResult {
  /** Success status */
  success: boolean;
  /** Recorded video blob */
  blob?: Blob;
  /** Duration in milliseconds */
  duration?: number;
  /** File size in bytes */
  size?: number;
  /** MIME type of the recording */
  mimeType?: string;
  /** Error message if failed */
  error?: string;
  /** Timestamp when recording started */
  startedAt?: number;
  /** Timestamp when recording ended */
  endedAt?: number;
}

/**
 * Recording progress event
 */
export interface RecordingProgress {
  /** Current recording duration in milliseconds */
  duration: number;
  /** Estimated file size in bytes */
  estimatedSize: number;
  /** Current state */
  state: RecordingState;
}

/**
 * Recorder service interface
 *
 * Provides methods for screen/video recording with proper lifecycle management.
 */
export interface RecorderService {
  /**
   * Get current recording state
   */
  readonly state: RecordingState;

  /**
   * Check if recording is currently active
   */
  readonly isRecording: boolean;

  /**
   * Start recording
   *
   * @param options - Recording configuration options
   * @returns Promise resolving to true if recording started successfully
   */
  start(options?: RecordingOptions): Promise<boolean>;

  /**
   * Stop recording and get the result
   *
   * @returns Promise resolving to the recording result
   */
  stop(): Promise<RecordingResult>;

  /**
   * Pause recording
   *
   * @returns true if pause was successful
   */
  pause(): boolean;

  /**
   * Resume recording
   *
   * @returns true if resume was successful
   */
  resume(): boolean;

  /**
   * Cancel recording without saving
   */
  cancel(): void;

  /**
   * Get current recording duration in milliseconds
   */
  getDuration(): number;

  /**
   * Subscribe to recording progress updates
   *
   * @param callback - Progress callback function
   * @returns Unsubscribe function
   */
  onProgress(callback: (progress: RecordingProgress) => void): () => void;

  /**
   * Subscribe to state changes
   *
   * @param callback - State change callback
   * @returns Unsubscribe function
   */
  onStateChange(callback: (state: RecordingState) => void): () => void;

  /**
   * Check if recording is supported in current environment
   */
  isSupported(): boolean;

  /**
   * Get supported MIME types
   */
  getSupportedMimeTypes(): string[];

  /**
   * Clean up resources
   */
  dispose(): void;
}
