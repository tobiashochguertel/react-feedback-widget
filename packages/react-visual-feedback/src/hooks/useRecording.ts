/**
 * React Visual Feedback - useRecording Hook
 *
 * Custom hook for managing screen recording functionality.
 * This hook implements the Interface Segregation Principle by providing
 * a focused API for recording control.
 *
 * @packageDocumentation
 */

import { useState, useCallback, useMemo, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Event log entry for recording
 */
export interface EventLogEntry {
  timestamp: number;
  type: string;
  data?: unknown;
}

/**
 * Recording service interface for dependency injection
 */
export interface RecordingService {
  start: () => Promise<void>;
  stop: () => Promise<{ blob: Blob; events: EventLogEntry[] }>;
  pause: () => void;
  resume: () => void;
  isSupported: () => boolean;
}

/**
 * Recording state enum
 */
export type RecordingState = 'idle' | 'initializing' | 'recording' | 'paused' | 'stopping' | 'complete' | 'error';

/**
 * Options for the useRecording hook
 */
export interface UseRecordingOptions {
  /**
   * Recording service instance for dependency injection.
   * If not provided, recording operations will not be available.
   */
  recordingService?: RecordingService;

  /**
   * Callback invoked when recording completes successfully.
   */
  onRecordingComplete?: (blob: Blob, events: EventLogEntry[]) => void;

  /**
   * Callback invoked when a recording error occurs.
   */
  onRecordingError?: (error: Error) => void;

  /**
   * Callback invoked when recording state changes.
   */
  onStateChange?: (state: RecordingState) => void;
}

/**
 * Return type of the useRecording hook
 */
export interface UseRecordingReturn {
  /** Current recording state */
  recordingState: RecordingState;

  /** Whether recording is currently active (recording or paused) */
  isRecording: boolean;

  /** Whether recording is initializing */
  isInitializing: boolean;

  /** Whether recording is paused */
  isPaused: boolean;

  /** Whether recording service is supported */
  isSupported: boolean;

  /** The recorded video blob (available after recording completes) */
  videoBlob: Blob | null;

  /** Event logs captured during recording */
  eventLogs: EventLogEntry[];

  /** Error that occurred during recording (if any) */
  error: Error | null;

  /** Start recording */
  start: () => Promise<void>;

  /** Stop recording and get the result */
  stop: () => Promise<void>;

  /** Pause recording */
  pause: () => void;

  /** Resume recording after pause */
  resume: () => void;

  /** Cancel recording (discard any recorded content) */
  cancel: () => void;

  /** Reset the recording state to idle */
  reset: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing screen recording functionality.
 *
 * Provides a complete recording lifecycle management:
 * - start: Begin recording
 * - pause/resume: Pause and resume recording
 * - stop: Stop and save recording
 * - cancel: Cancel and discard recording
 *
 * @example
 * ```tsx
 * function RecordingControls() {
 *   const recording = useRecording({
 *     recordingService: myRecordingService,
 *     onRecordingComplete: (blob, events) => {
 *       console.log('Recording complete!', blob, events);
 *     },
 *     onRecordingError: (error) => {
 *       console.error('Recording failed:', error);
 *     },
 *   });
 *
 *   return (
 *     <div>
 *       {recording.isRecording ? (
 *         <>
 *           <button onClick={recording.stop}>Stop</button>
 *           <button onClick={recording.isPaused ? recording.resume : recording.pause}>
 *             {recording.isPaused ? 'Resume' : 'Pause'}
 *           </button>
 *         </>
 *       ) : (
 *         <button onClick={recording.start}>Start Recording</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useRecording(options: UseRecordingOptions = {}): UseRecordingReturn {
  const {
    recordingService,
    onRecordingComplete,
    onRecordingError,
    onStateChange,
  } = options;

  // State
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [eventLogs, setEventLogs] = useState<EventLogEntry[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // Ref to track if recording service is available
  const serviceRef = useRef(recordingService);
  serviceRef.current = recordingService;

  // Helper to update state and notify
  const updateState = useCallback((newState: RecordingState) => {
    setRecordingState(newState);
    onStateChange?.(newState);
  }, [onStateChange]);

  // Derived states
  const isRecording = recordingState === 'recording' || recordingState === 'paused';
  const isInitializing = recordingState === 'initializing';
  const isPaused = recordingState === 'paused';
  const isSupported = recordingService?.isSupported?.() ?? false;

  // Start recording
  const start = useCallback(async () => {
    if (!serviceRef.current) {
      const err = new Error('Recording service not available');
      setError(err);
      onRecordingError?.(err);
      return;
    }

    if (recordingState !== 'idle' && recordingState !== 'complete' && recordingState !== 'error') {
      return; // Already recording or initializing
    }

    try {
      setError(null);
      setVideoBlob(null);
      setEventLogs([]);
      updateState('initializing');

      await serviceRef.current.start();

      updateState('recording');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      updateState('error');
      onRecordingError?.(error);
    }
  }, [recordingState, updateState, onRecordingError]);

  // Stop recording
  const stop = useCallback(async () => {
    if (!serviceRef.current) {
      return;
    }

    if (recordingState !== 'recording' && recordingState !== 'paused') {
      return; // Not recording
    }

    try {
      updateState('stopping');

      const result = await serviceRef.current.stop();

      setVideoBlob(result.blob);
      setEventLogs(result.events);
      updateState('complete');

      onRecordingComplete?.(result.blob, result.events);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      updateState('error');
      onRecordingError?.(error);
    }
  }, [recordingState, updateState, onRecordingComplete, onRecordingError]);

  // Pause recording
  const pause = useCallback(() => {
    if (!serviceRef.current) {
      return;
    }

    if (recordingState !== 'recording') {
      return; // Can only pause when recording
    }

    serviceRef.current.pause();
    updateState('paused');
  }, [recordingState, updateState]);

  // Resume recording
  const resume = useCallback(() => {
    if (!serviceRef.current) {
      return;
    }

    if (recordingState !== 'paused') {
      return; // Can only resume when paused
    }

    serviceRef.current.resume();
    updateState('recording');
  }, [recordingState, updateState]);

  // Cancel recording
  const cancel = useCallback(() => {
    if (recordingState !== 'recording' && recordingState !== 'paused' && recordingState !== 'initializing') {
      return; // Nothing to cancel
    }

    // Stop the service if available (ignore errors)
    serviceRef.current?.stop().catch(() => {
      // Ignore errors when cancelling
    });

    setVideoBlob(null);
    setEventLogs([]);
    setError(null);
    updateState('idle');
  }, [recordingState, updateState]);

  // Reset to idle state
  const reset = useCallback(() => {
    setVideoBlob(null);
    setEventLogs([]);
    setError(null);
    updateState('idle');
  }, [updateState]);

  // Memoize return value
  return useMemo(
    () => ({
      recordingState,
      isRecording,
      isInitializing,
      isPaused,
      isSupported,
      videoBlob,
      eventLogs,
      error,
      start,
      stop,
      pause,
      resume,
      cancel,
      reset,
    }),
    [
      recordingState,
      isRecording,
      isInitializing,
      isPaused,
      isSupported,
      videoBlob,
      eventLogs,
      error,
      start,
      stop,
      pause,
      resume,
      cancel,
      reset,
    ]
  );
}
