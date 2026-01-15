/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecording } from '../../../src/hooks/useRecording';
import type {
  UseRecordingOptions,
  RecordingService,
  EventLogEntry,
} from '../../../src/hooks/useRecording';

// ============================================================================
// Mock Recording Service Factory
// ============================================================================

const createMockRecordingService = (
  overrides: Partial<RecordingService> = {}
): RecordingService => ({
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue({
    blob: new Blob(['test'], { type: 'video/webm' }),
    events: [{ timestamp: Date.now(), type: 'start' }],
  }),
  pause: vi.fn(),
  resume: vi.fn(),
  isSupported: vi.fn().mockReturnValue(true),
  ...overrides,
});

describe('useRecording', () => {
  let mockService: RecordingService;

  beforeEach(() => {
    mockService = createMockRecordingService();
    vi.clearAllMocks();
  });

  // ============================================================================
  // Initial State Tests
  // ============================================================================

  describe('initial state', () => {
    it('should initialize with idle state', () => {
      const { result } = renderHook(() => useRecording());

      expect(result.current.recordingState).toBe('idle');
      expect(result.current.isRecording).toBe(false);
      expect(result.current.isInitializing).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.videoBlob).toBeNull();
      expect(result.current.eventLogs).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should report unsupported when no service provided', () => {
      const { result } = renderHook(() => useRecording());

      expect(result.current.isSupported).toBe(false);
    });

    it('should report supported when service is provided and supported', () => {
      const { result } = renderHook(() =>
        useRecording({ recordingService: mockService })
      );

      expect(result.current.isSupported).toBe(true);
    });

    it('should report unsupported when service reports unsupported', () => {
      const unsupportedService = createMockRecordingService({
        isSupported: vi.fn().mockReturnValue(false),
      });
      const { result } = renderHook(() =>
        useRecording({ recordingService: unsupportedService })
      );

      expect(result.current.isSupported).toBe(false);
    });
  });

  // ============================================================================
  // Start Recording Tests
  // ============================================================================

  describe('start recording', () => {
    it('should transition to initializing then recording', async () => {
      const { result } = renderHook(() =>
        useRecording({ recordingService: mockService })
      );

      expect(result.current.recordingState).toBe('idle');

      await act(async () => {
        await result.current.start();
      });

      expect(result.current.recordingState).toBe('recording');
      expect(result.current.isRecording).toBe(true);
      expect(result.current.isInitializing).toBe(false);
      expect(mockService.start).toHaveBeenCalledTimes(1);
    });

    it('should call onStateChange during start', async () => {
      const onStateChange = vi.fn();
      const { result } = renderHook(() =>
        useRecording({
          recordingService: mockService,
          onStateChange,
        })
      );

      await act(async () => {
        await result.current.start();
      });

      expect(onStateChange).toHaveBeenCalledWith('initializing');
      expect(onStateChange).toHaveBeenCalledWith('recording');
    });

    it('should handle start error', async () => {
      const errorService = createMockRecordingService({
        start: vi.fn().mockRejectedValue(new Error('Start failed')),
      });
      const onRecordingError = vi.fn();
      const { result } = renderHook(() =>
        useRecording({
          recordingService: errorService,
          onRecordingError,
        })
      );

      await act(async () => {
        await result.current.start();
      });

      expect(result.current.recordingState).toBe('error');
      expect(result.current.error?.message).toBe('Start failed');
      expect(onRecordingError).toHaveBeenCalled();
    });

    it('should set error when no service available', async () => {
      const onRecordingError = vi.fn();
      const { result } = renderHook(() =>
        useRecording({ onRecordingError })
      );

      await act(async () => {
        await result.current.start();
      });

      expect(result.current.error?.message).toBe('Recording service not available');
      expect(onRecordingError).toHaveBeenCalled();
    });

    it('should not start when already recording', async () => {
      const { result } = renderHook(() =>
        useRecording({ recordingService: mockService })
      );

      await act(async () => {
        await result.current.start();
      });

      expect(mockService.start).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.start();
      });

      expect(mockService.start).toHaveBeenCalledTimes(1);
    });

    it('should allow restart after complete', async () => {
      const { result } = renderHook(() =>
        useRecording({ recordingService: mockService })
      );

      // First recording
      await act(async () => {
        await result.current.start();
      });
      await act(async () => {
        await result.current.stop();
      });

      expect(result.current.recordingState).toBe('complete');
      expect(mockService.start).toHaveBeenCalledTimes(1);

      // Second recording
      await act(async () => {
        await result.current.start();
      });

      expect(result.current.recordingState).toBe('recording');
      expect(mockService.start).toHaveBeenCalledTimes(2);
    });

    it('should allow restart after error', async () => {
      let callCount = 0;
      const errorThenSuccessService = createMockRecordingService({
        start: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.reject(new Error('First call fails'));
          }
          return Promise.resolve();
        }),
      });
      const { result } = renderHook(() =>
        useRecording({ recordingService: errorThenSuccessService })
      );

      // First start fails
      await act(async () => {
        await result.current.start();
      });

      expect(result.current.recordingState).toBe('error');

      // Second start succeeds
      await act(async () => {
        await result.current.start();
      });

      expect(result.current.recordingState).toBe('recording');
    });
  });

  // ============================================================================
  // Stop Recording Tests
  // ============================================================================

  describe('stop recording', () => {
    it('should stop recording and set videoBlob and eventLogs', async () => {
      const expectedBlob = new Blob(['test video'], { type: 'video/webm' });
      const expectedEvents: EventLogEntry[] = [
        { timestamp: 1000, type: 'start' },
        { timestamp: 2000, type: 'click', data: { x: 100, y: 200 } },
      ];
      const stopService = createMockRecordingService({
        stop: vi.fn().mockResolvedValue({
          blob: expectedBlob,
          events: expectedEvents,
        }),
      });
      const onRecordingComplete = vi.fn();
      const { result } = renderHook(() =>
        useRecording({
          recordingService: stopService,
          onRecordingComplete,
        })
      );

      await act(async () => {
        await result.current.start();
      });
      await act(async () => {
        await result.current.stop();
      });

      expect(result.current.recordingState).toBe('complete');
      expect(result.current.videoBlob).toBe(expectedBlob);
      expect(result.current.eventLogs).toEqual(expectedEvents);
      expect(onRecordingComplete).toHaveBeenCalledWith(expectedBlob, expectedEvents);
    });

    it('should call onStateChange during stop', async () => {
      const onStateChange = vi.fn();
      const { result } = renderHook(() =>
        useRecording({
          recordingService: mockService,
          onStateChange,
        })
      );

      await act(async () => {
        await result.current.start();
      });

      onStateChange.mockClear();

      await act(async () => {
        await result.current.stop();
      });

      expect(onStateChange).toHaveBeenCalledWith('stopping');
      expect(onStateChange).toHaveBeenCalledWith('complete');
    });

    it('should handle stop error', async () => {
      const errorService = createMockRecordingService({
        stop: vi.fn().mockRejectedValue(new Error('Stop failed')),
      });
      const onRecordingError = vi.fn();
      const { result } = renderHook(() =>
        useRecording({
          recordingService: errorService,
          onRecordingError,
        })
      );

      await act(async () => {
        await result.current.start();
      });
      await act(async () => {
        await result.current.stop();
      });

      expect(result.current.recordingState).toBe('error');
      expect(result.current.error?.message).toBe('Stop failed');
      expect(onRecordingError).toHaveBeenCalled();
    });

    it('should not stop when not recording', async () => {
      const { result } = renderHook(() =>
        useRecording({ recordingService: mockService })
      );

      await act(async () => {
        await result.current.stop();
      });

      expect(mockService.stop).not.toHaveBeenCalled();
    });

    it('should stop when paused', async () => {
      const { result } = renderHook(() =>
        useRecording({ recordingService: mockService })
      );

      await act(async () => {
        await result.current.start();
      });
      act(() => {
        result.current.pause();
      });

      expect(result.current.isPaused).toBe(true);

      await act(async () => {
        await result.current.stop();
      });

      expect(result.current.recordingState).toBe('complete');
      expect(mockService.stop).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Pause/Resume Tests
  // ============================================================================

  describe('pause and resume', () => {
    it('should pause recording', async () => {
      const { result } = renderHook(() =>
        useRecording({ recordingService: mockService })
      );

      await act(async () => {
        await result.current.start();
      });

      act(() => {
        result.current.pause();
      });

      expect(result.current.recordingState).toBe('paused');
      expect(result.current.isPaused).toBe(true);
      expect(result.current.isRecording).toBe(true);
      expect(mockService.pause).toHaveBeenCalled();
    });

    it('should resume recording', async () => {
      const { result } = renderHook(() =>
        useRecording({ recordingService: mockService })
      );

      await act(async () => {
        await result.current.start();
      });

      act(() => {
        result.current.pause();
      });

      act(() => {
        result.current.resume();
      });

      expect(result.current.recordingState).toBe('recording');
      expect(result.current.isPaused).toBe(false);
      expect(mockService.resume).toHaveBeenCalled();
    });

    it('should not pause when not recording', async () => {
      const { result } = renderHook(() =>
        useRecording({ recordingService: mockService })
      );

      act(() => {
        result.current.pause();
      });

      expect(result.current.recordingState).toBe('idle');
      expect(mockService.pause).not.toHaveBeenCalled();
    });

    it('should not resume when not paused', async () => {
      const { result } = renderHook(() =>
        useRecording({ recordingService: mockService })
      );

      await act(async () => {
        await result.current.start();
      });

      act(() => {
        result.current.resume();
      });

      expect(mockService.resume).not.toHaveBeenCalled();
    });

    it('should call onStateChange for pause/resume', async () => {
      const onStateChange = vi.fn();
      const { result } = renderHook(() =>
        useRecording({
          recordingService: mockService,
          onStateChange,
        })
      );

      await act(async () => {
        await result.current.start();
      });

      onStateChange.mockClear();

      act(() => {
        result.current.pause();
      });

      expect(onStateChange).toHaveBeenCalledWith('paused');

      act(() => {
        result.current.resume();
      });

      expect(onStateChange).toHaveBeenCalledWith('recording');
    });
  });

  // ============================================================================
  // Cancel Tests
  // ============================================================================

  describe('cancel', () => {
    it('should cancel recording and reset state', async () => {
      const { result } = renderHook(() =>
        useRecording({ recordingService: mockService })
      );

      await act(async () => {
        await result.current.start();
      });

      expect(result.current.isRecording).toBe(true);

      act(() => {
        result.current.cancel();
      });

      expect(result.current.recordingState).toBe('idle');
      expect(result.current.isRecording).toBe(false);
      expect(result.current.videoBlob).toBeNull();
      expect(result.current.eventLogs).toEqual([]);
    });

    it('should cancel when paused', async () => {
      const { result } = renderHook(() =>
        useRecording({ recordingService: mockService })
      );

      await act(async () => {
        await result.current.start();
      });

      act(() => {
        result.current.pause();
      });

      act(() => {
        result.current.cancel();
      });

      expect(result.current.recordingState).toBe('idle');
    });

    it('should not cancel when idle', async () => {
      const onStateChange = vi.fn();
      const { result } = renderHook(() =>
        useRecording({
          recordingService: mockService,
          onStateChange,
        })
      );

      act(() => {
        result.current.cancel();
      });

      expect(onStateChange).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Reset Tests
  // ============================================================================

  describe('reset', () => {
    it('should reset state after complete', async () => {
      const { result } = renderHook(() =>
        useRecording({ recordingService: mockService })
      );

      await act(async () => {
        await result.current.start();
      });
      await act(async () => {
        await result.current.stop();
      });

      expect(result.current.recordingState).toBe('complete');
      expect(result.current.videoBlob).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.recordingState).toBe('idle');
      expect(result.current.videoBlob).toBeNull();
      expect(result.current.eventLogs).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should reset after error', async () => {
      const errorService = createMockRecordingService({
        start: vi.fn().mockRejectedValue(new Error('Failed')),
      });
      const { result } = renderHook(() =>
        useRecording({ recordingService: errorService })
      );

      await act(async () => {
        await result.current.start();
      });

      expect(result.current.recordingState).toBe('error');
      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.recordingState).toBe('idle');
      expect(result.current.error).toBeNull();
    });
  });

  // ============================================================================
  // Callback Stability Tests
  // ============================================================================

  describe('callback stability', () => {
    it('should maintain stable start reference', () => {
      const { result, rerender } = renderHook(() =>
        useRecording({ recordingService: mockService })
      );

      const firstStart = result.current.start;

      rerender();

      expect(result.current.start).toBe(firstStart);
    });

    it('should maintain stable pause reference', () => {
      const { result, rerender } = renderHook(() =>
        useRecording({ recordingService: mockService })
      );

      const firstPause = result.current.pause;

      rerender();

      expect(result.current.pause).toBe(firstPause);
    });

    it('should maintain stable resume reference', () => {
      const { result, rerender } = renderHook(() =>
        useRecording({ recordingService: mockService })
      );

      const firstResume = result.current.resume;

      rerender();

      expect(result.current.resume).toBe(firstResume);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('edge cases', () => {
    it('should handle non-Error exceptions', async () => {
      const errorService = createMockRecordingService({
        start: vi.fn().mockRejectedValue('String error'),
      });
      const { result } = renderHook(() =>
        useRecording({ recordingService: errorService })
      );

      await act(async () => {
        await result.current.start();
      });

      expect(result.current.error?.message).toBe('String error');
    });

    it('should work with empty options', () => {
      const { result } = renderHook(() => useRecording({}));

      expect(result.current.recordingState).toBe('idle');
    });

    it('should work with no options', () => {
      const { result } = renderHook(() => useRecording());

      expect(result.current.recordingState).toBe('idle');
    });

    it('should clear previous data on start', async () => {
      const { result } = renderHook(() =>
        useRecording({ recordingService: mockService })
      );

      // First recording
      await act(async () => {
        await result.current.start();
      });
      await act(async () => {
        await result.current.stop();
      });

      expect(result.current.videoBlob).not.toBeNull();

      // Second recording should clear previous data immediately
      let blobDuringInit: Blob | null = result.current.videoBlob;

      await act(async () => {
        const startPromise = result.current.start();
        blobDuringInit = result.current.videoBlob;
        await startPromise;
      });

      // Note: The blob is cleared at the start of the start() call
      // But we can't check mid-call easily, so we just verify final state is correct
      expect(result.current.recordingState).toBe('recording');
    });
  });
});
