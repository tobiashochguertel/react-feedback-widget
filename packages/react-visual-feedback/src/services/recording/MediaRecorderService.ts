/**
 * MediaRecorder Service Implementation
 *
 * Implements RecorderService interface using browser MediaRecorder API.
 * Provides screen and tab recording with audio support.
 *
 * @packageDocumentation
 */

import type {
  RecorderService,
  RecordingState,
  RecordingOptions,
  RecordingResult,
  RecordingProgress,
} from './RecorderService';
import {
  VIDEO_DIMENSIONS,
  RECORDING_QUALITY,
  TIMING,
} from '../../constants';

/**
 * Default recording options
 */
const DEFAULT_OPTIONS: RecordingOptions = {
  width: VIDEO_DIMENSIONS.WIDTH,
  height: VIDEO_DIMENSIONS.HEIGHT,
  frameRate: RECORDING_QUALITY.FRAME_RATE,
  videoBitsPerSecond: RECORDING_QUALITY.VIDEO_BITRATE,
  mimeType: 'video/webm;codecs=vp9',
  includeAudio: false,
  includeCursor: true,
};

/**
 * Common video MIME types to check for support
 */
const MIME_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=vp8',
  'video/webm',
  'video/mp4',
];

/**
 * Media Recorder service implementation using browser MediaRecorder API
 *
 * @example
 * ```typescript
 * const recorder = new MediaRecorderService();
 * await recorder.start({ includeAudio: true });
 * // ... recording in progress
 * const result = await recorder.stop();
 * if (result.success) {
 *   // Use result.blob
 * }
 * ```
 */
export class MediaRecorderService implements RecorderService {
  private _state: RecordingState = 'idle';
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];
  private startTime: number = 0;
  private pauseTime: number = 0;
  private pausedDuration: number = 0;
  private options: RecordingOptions = DEFAULT_OPTIONS;

  // Callbacks
  private progressCallbacks: Set<(progress: RecordingProgress) => void> = new Set();
  private stateCallbacks: Set<(state: RecordingState) => void> = new Set();
  private progressInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Get current recording state
   */
  get state(): RecordingState {
    return this._state;
  }

  /**
   * Check if recording is currently active
   */
  get isRecording(): boolean {
    return this._state === 'recording' || this._state === 'paused';
  }

  /**
   * Update state and notify listeners
   */
  private setState(newState: RecordingState): void {
    this._state = newState;
    this.stateCallbacks.forEach((callback) => callback(newState));
  }

  /**
   * Start recording
   */
  async start(options?: RecordingOptions): Promise<boolean> {
    if (this.isRecording) {
      return false;
    }

    try {
      this.setState('preparing');
      this.options = { ...DEFAULT_OPTIONS, ...options };
      this.recordedChunks = [];
      this.pausedDuration = 0;

      // Request display media
      const displayMediaOptions = {
        video: {
          cursor: this.options.includeCursor ? 'always' : ('never' as const),
          width: { ideal: this.options.width, max: this.options.width },
          height: { ideal: this.options.height, max: this.options.height },
          frameRate: { ideal: this.options.frameRate, max: this.options.frameRate },
        },
        audio: this.options.includeAudio || false,
        preferCurrentTab: true,
      };

      this.stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions as MediaStreamConstraints);

      // Find supported MIME type
      const mimeType = this.findSupportedMimeType();
      if (!mimeType) {
        throw new Error('No supported MIME type found');
      }

      // Create MediaRecorder
      const recorderOptions: MediaRecorderOptions = {
        mimeType,
        ...(this.options.videoBitsPerSecond !== undefined && { videoBitsPerSecond: this.options.videoBitsPerSecond }),
        ...(this.options.audioBitsPerSecond !== undefined && { audioBitsPerSecond: this.options.audioBitsPerSecond }),
      };
      this.mediaRecorder = new MediaRecorder(this.stream, recorderOptions);

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      // Handle stream end (user stops sharing)
      this.stream.getVideoTracks()[0].onended = () => {
        if (this.isRecording) {
          this.stop();
        }
      };

      // Start recording
      this.mediaRecorder.start(TIMING.RECORDING_CHUNK_INTERVAL); // Collect data every 100ms
      this.startTime = Date.now();
      this.setState('recording');

      // Start progress updates
      this.startProgressUpdates();

      return true;
    } catch (error) {
      this.setState('error');
      this.cleanup();
      console.error('Failed to start recording:', error);
      return false;
    }
  }

  /**
   * Stop recording and get the result
   */
  async stop(): Promise<RecordingResult> {
    if (this._state !== 'recording' && this._state !== 'paused') {
      return {
        success: false,
        error: 'Not currently recording',
      };
    }

    this.setState('stopping');
    this.stopProgressUpdates();

    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        this.cleanup();
        resolve({
          success: false,
          error: 'MediaRecorder not initialized',
        });
        return;
      }

      this.mediaRecorder.onstop = () => {
        const duration = this.getDuration();
        const mimeType = this.options.mimeType || 'video/webm';

        if (this.recordedChunks.length === 0) {
          this.cleanup();
          resolve({
            success: false,
            error: 'No data recorded',
          });
          return;
        }

        const blob = new Blob(this.recordedChunks, { type: mimeType });

        this.cleanup();
        this.setState('completed');

        resolve({
          success: true,
          blob,
          duration,
          size: blob.size,
          mimeType,
          startedAt: this.startTime,
          endedAt: Date.now(),
        });
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Pause recording
   */
  pause(): boolean {
    if (this._state !== 'recording' || !this.mediaRecorder) {
      return false;
    }

    try {
      this.mediaRecorder.pause();
      this.pauseTime = Date.now();
      this.setState('paused');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Resume recording
   */
  resume(): boolean {
    if (this._state !== 'paused' || !this.mediaRecorder) {
      return false;
    }

    try {
      this.mediaRecorder.resume();
      this.pausedDuration += Date.now() - this.pauseTime;
      this.setState('recording');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cancel recording without saving
   */
  cancel(): void {
    this.stopProgressUpdates();

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    this.cleanup();
    this.setState('idle');
    this.recordedChunks = [];
  }

  /**
   * Get current recording duration in milliseconds
   */
  getDuration(): number {
    if (!this.startTime) {
      return 0;
    }

    const now = this._state === 'paused' ? this.pauseTime : Date.now();
    return now - this.startTime - this.pausedDuration;
  }

  /**
   * Subscribe to recording progress updates
   */
  onProgress(callback: (progress: RecordingProgress) => void): () => void {
    this.progressCallbacks.add(callback);
    return () => {
      this.progressCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: RecordingState) => void): () => void {
    this.stateCallbacks.add(callback);
    return () => {
      this.stateCallbacks.delete(callback);
    };
  }

  /**
   * Check if recording is supported in current environment
   */
  isSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator.mediaDevices !== 'undefined' &&
      typeof navigator.mediaDevices.getDisplayMedia === 'function' &&
      typeof MediaRecorder !== 'undefined'
    );
  }

  /**
   * Get supported MIME types
   */
  getSupportedMimeTypes(): string[] {
    if (typeof MediaRecorder === 'undefined') {
      return [];
    }

    return MIME_TYPES.filter((mimeType) => MediaRecorder.isTypeSupported(mimeType));
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.cancel();
    this.progressCallbacks.clear();
    this.stateCallbacks.clear();
  }

  /**
   * Find a supported MIME type
   */
  private findSupportedMimeType(): string | null {
    const preferred = this.options.mimeType;
    if (preferred && MediaRecorder.isTypeSupported(preferred)) {
      return preferred;
    }

    return MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) || null;
  }

  /**
   * Start progress update interval
   */
  private startProgressUpdates(): void {
    this.stopProgressUpdates();

    this.progressInterval = setInterval(() => {
      const progress: RecordingProgress = {
        duration: this.getDuration(),
        estimatedSize: this.getEstimatedSize(),
        state: this._state,
      };

      this.progressCallbacks.forEach((callback) => callback(progress));

      // Check max duration
      if (this.options.maxDuration && progress.duration >= this.options.maxDuration) {
        this.stop();
      }
    }, TIMING.TIMER_INTERVAL);
  }

  /**
   * Stop progress update interval
   */
  private stopProgressUpdates(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /**
   * Get estimated file size based on bitrate and duration
   */
  private getEstimatedSize(): number {
    const durationSeconds = this.getDuration() / TIMING.TIMER_INTERVAL;
    const bitsPerSecond = this.options.videoBitsPerSecond || RECORDING_QUALITY.VIDEO_BITRATE;
    return Math.floor((durationSeconds * bitsPerSecond) / 8);
  }

  /**
   * Clean up streams and recorder
   */
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.mediaRecorder = null;
  }
}
