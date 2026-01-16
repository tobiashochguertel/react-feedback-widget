/**
 * Mock Recorder Service Implementation
 *
 * Implements RecorderService interface for testing purposes.
 * Simulates recording without actual media capture.
 *
 * @packageDocumentation
 */

import type {
  RecorderService,
  RecordingState,
  RecordingOptions,
  ServiceRecordingResult,
  RecordingProgress,
} from './RecorderService';

/**
 * Mock recorder service for testing
 *
 * Simulates the recording lifecycle without accessing browser APIs.
 * Useful for unit tests and development environments.
 *
 * @example
 * ```typescript
 * const recorder = new MockRecorderService();
 * recorder.mockBlob = new Blob(['test'], { type: 'video/webm' });
 * await recorder.start();
 * const result = await recorder.stop();
 * ```
 */
export class MockRecorderService implements RecorderService {
  private _state: RecordingState = 'idle';
  private startTime: number = 0;
  private pauseTime: number = 0;
  private pausedDuration: number = 0;

  // Callbacks
  private progressCallbacks: Set<(progress: RecordingProgress) => void> = new Set();
  private stateCallbacks: Set<(state: RecordingState) => void> = new Set();

  // Mock data - set these before calling stop() to control the result
  public mockBlob: Blob | null = null;
  public mockShouldFail: boolean = false;
  public mockError: string = 'Mock error';

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
   * Start mock recording
   */
  async start(_options?: RecordingOptions): Promise<boolean> {
    if (this.isRecording) {
      return false;
    }

    if (this.mockShouldFail) {
      this.setState('error');
      return false;
    }

    this.setState('preparing');

    // Simulate async preparation
    await new Promise((resolve) => setTimeout(resolve, 10));

    this.startTime = Date.now();
    this.pausedDuration = 0;
    this.setState('recording');

    return true;
  }

  /**
   * Stop mock recording
   */
  async stop(): Promise<ServiceRecordingResult> {
    if (this._state !== 'recording' && this._state !== 'paused') {
      return {
        success: false,
        error: 'Not currently recording',
      };
    }

    this.setState('stopping');

    // Simulate async stop
    await new Promise((resolve) => setTimeout(resolve, 10));

    const duration = this.getDuration();

    if (this.mockShouldFail || !this.mockBlob) {
      this.setState('error');
      return {
        success: false,
        error: this.mockError,
      };
    }

    this.setState('completed');

    return {
      success: true,
      blob: this.mockBlob,
      duration,
      size: this.mockBlob.size,
      mimeType: this.mockBlob.type,
      startedAt: this.startTime,
      endedAt: Date.now(),
    };
  }

  /**
   * Pause mock recording
   */
  pause(): boolean {
    if (this._state !== 'recording') {
      return false;
    }

    this.pauseTime = Date.now();
    this.setState('paused');
    return true;
  }

  /**
   * Resume mock recording
   */
  resume(): boolean {
    if (this._state !== 'paused') {
      return false;
    }

    this.pausedDuration += Date.now() - this.pauseTime;
    this.setState('recording');
    return true;
  }

  /**
   * Cancel mock recording
   */
  cancel(): void {
    this.setState('idle');
    this.startTime = 0;
    this.pausedDuration = 0;
  }

  /**
   * Get mock duration
   */
  getDuration(): number {
    if (!this.startTime) {
      return 0;
    }

    const now = this._state === 'paused' ? this.pauseTime : Date.now();
    return now - this.startTime - this.pausedDuration;
  }

  /**
   * Subscribe to progress updates
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
   * Mock always returns true for support check
   */
  isSupported(): boolean {
    return true;
  }

  /**
   * Return mock supported MIME types
   */
  getSupportedMimeTypes(): string[] {
    return ['video/webm', 'video/mp4'];
  }

  /**
   * Clean up
   */
  dispose(): void {
    this.cancel();
    this.progressCallbacks.clear();
    this.stateCallbacks.clear();
    this.mockBlob = null;
  }

  /**
   * Emit a progress event manually (useful for testing)
   */
  emitProgress(progress: RecordingProgress): void {
    this.progressCallbacks.forEach((callback) => callback(progress));
  }

  /**
   * Reset mock to initial state (useful between tests)
   */
  reset(): void {
    this.dispose();
    this._state = 'idle';
    this.mockShouldFail = false;
    this.mockError = 'Mock error';
  }
}
