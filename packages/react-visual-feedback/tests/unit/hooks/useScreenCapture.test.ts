/**
 * React Visual Feedback - useScreenCapture Hook Tests
 *
 * Comprehensive tests for the useScreenCapture hook covering:
 * - Initial state management
 * - Element capture functionality
 * - Viewport capture functionality
 * - Error handling
 * - State transitions
 * - Callback invocations
 * - Clear/reset functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useScreenCapture,
  ScreenshotService,
  CaptureState,
} from '../../../src/hooks/useScreenCapture';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Creates a mock screenshot service for testing
 */
function createMockScreenshotService(overrides: Partial<ScreenshotService> = {}): ScreenshotService {
  return {
    captureElement: vi.fn().mockResolvedValue('data:image/png;base64,element-screenshot'),
    captureViewport: vi.fn().mockResolvedValue('data:image/png;base64,viewport-screenshot'),
    isSupported: vi.fn().mockReturnValue(true),
    ...overrides,
  };
}

/**
 * Creates a mock HTML element for testing
 */
function createMockElement(): HTMLElement {
  return document.createElement('div');
}

// ============================================================================
// Tests
// ============================================================================

describe('useScreenCapture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Initial State Tests
  // ==========================================================================

  describe('initial state', () => {
    it('should initialize with idle state when no service provided', () => {
      const { result } = renderHook(() => useScreenCapture());

      expect(result.current.captureState).toBe('idle');
      expect(result.current.isCapturing).toBe(false);
      expect(result.current.isSupported).toBe(false);
      expect(result.current.screenshot).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should initialize with idle state when service provided', () => {
      const service = createMockScreenshotService();
      const { result } = renderHook(() =>
        useScreenCapture({ screenshotService: service })
      );

      expect(result.current.captureState).toBe('idle');
      expect(result.current.isCapturing).toBe(false);
      expect(result.current.isSupported).toBe(true);
      expect(result.current.screenshot).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should check isSupported from service', () => {
      const unsupportedService = createMockScreenshotService({
        isSupported: vi.fn().mockReturnValue(false),
      });
      const { result } = renderHook(() =>
        useScreenCapture({ screenshotService: unsupportedService })
      );

      expect(result.current.isSupported).toBe(false);
    });
  });

  // ==========================================================================
  // Element Capture Tests
  // ==========================================================================

  describe('capture (element)', () => {
    it('should capture an element successfully', async () => {
      const service = createMockScreenshotService();
      const { result } = renderHook(() =>
        useScreenCapture({ screenshotService: service })
      );

      const element = createMockElement();
      let capturedData: string | null = null;

      await act(async () => {
        capturedData = await result.current.capture(element);
      });

      expect(capturedData).toBe('data:image/png;base64,element-screenshot');
      expect(result.current.screenshot).toBe('data:image/png;base64,element-screenshot');
      expect(result.current.captureState).toBe('complete');
      expect(result.current.isCapturing).toBe(false);
      expect(service.captureElement).toHaveBeenCalledWith(element);
    });

    it('should transition to capturing state during capture', async () => {
      let resolveFn: (value: string) => void;
      const service = createMockScreenshotService({
        captureElement: vi.fn().mockImplementation(() => {
          return new Promise((resolve) => {
            resolveFn = resolve;
          });
        }),
      });

      const { result } = renderHook(() =>
        useScreenCapture({ screenshotService: service })
      );

      const element = createMockElement();
      let capturePromise: Promise<string | null>;

      act(() => {
        capturePromise = result.current.capture(element);
      });

      // Should be in capturing state
      expect(result.current.captureState).toBe('capturing');
      expect(result.current.isCapturing).toBe(true);

      // Resolve the capture
      await act(async () => {
        resolveFn!('data:image/png;base64,resolved');
        await capturePromise;
      });

      expect(result.current.captureState).toBe('complete');
      expect(result.current.isCapturing).toBe(false);
    });

    it('should call onCaptureComplete callback on success', async () => {
      const service = createMockScreenshotService();
      const onCaptureComplete = vi.fn();
      const { result } = renderHook(() =>
        useScreenCapture({ screenshotService: service, onCaptureComplete })
      );

      const element = createMockElement();

      await act(async () => {
        await result.current.capture(element);
      });

      expect(onCaptureComplete).toHaveBeenCalledTimes(1);
      expect(onCaptureComplete).toHaveBeenCalledWith('data:image/png;base64,element-screenshot');
    });

    it('should call onStateChange callback during capture', async () => {
      const service = createMockScreenshotService();
      const onStateChange = vi.fn();
      const { result } = renderHook(() =>
        useScreenCapture({ screenshotService: service, onStateChange })
      );

      const element = createMockElement();

      await act(async () => {
        await result.current.capture(element);
      });

      expect(onStateChange).toHaveBeenCalledWith('capturing');
      expect(onStateChange).toHaveBeenCalledWith('complete');
    });

    it('should handle capture error', async () => {
      const error = new Error('Capture failed');
      const service = createMockScreenshotService({
        captureElement: vi.fn().mockRejectedValue(error),
      });
      const onCaptureError = vi.fn();
      const { result } = renderHook(() =>
        useScreenCapture({ screenshotService: service, onCaptureError })
      );

      const element = createMockElement();
      let capturedData: string | null;

      await act(async () => {
        capturedData = await result.current.capture(element);
      });

      expect(capturedData!).toBeNull();
      expect(result.current.captureState).toBe('error');
      expect(result.current.error).toBe(error);
      expect(result.current.screenshot).toBeNull();
      expect(onCaptureError).toHaveBeenCalledWith(error);
    });

    it('should handle non-Error thrown values', async () => {
      const service = createMockScreenshotService({
        captureElement: vi.fn().mockRejectedValue('string error'),
      });
      const onCaptureError = vi.fn();
      const { result } = renderHook(() =>
        useScreenCapture({ screenshotService: service, onCaptureError })
      );

      const element = createMockElement();

      await act(async () => {
        await result.current.capture(element);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('string error');
    });

    it('should return null if no service available', async () => {
      const onCaptureError = vi.fn();
      const { result } = renderHook(() =>
        useScreenCapture({ onCaptureError })
      );

      const element = createMockElement();
      let capturedData: string | null;

      await act(async () => {
        capturedData = await result.current.capture(element);
      });

      expect(capturedData!).toBeNull();
      expect(result.current.error?.message).toBe('Screenshot service not available');
      expect(onCaptureError).toHaveBeenCalled();
    });

    it('should return null if already capturing', async () => {
      let resolveFn: (value: string) => void;
      const service = createMockScreenshotService({
        captureElement: vi.fn().mockImplementation(() => {
          return new Promise((resolve) => {
            resolveFn = resolve;
          });
        }),
      });

      const { result } = renderHook(() =>
        useScreenCapture({ screenshotService: service })
      );

      const element = createMockElement();
      let firstCapture: Promise<string | null>;
      let secondCapture: string | null;

      act(() => {
        firstCapture = result.current.capture(element);
      });

      // Try to capture again while first is in progress
      await act(async () => {
        secondCapture = await result.current.capture(element);
      });

      expect(secondCapture!).toBeNull();
      expect(service.captureElement).toHaveBeenCalledTimes(1);

      // Cleanup
      await act(async () => {
        resolveFn!('data');
        await firstCapture;
      });
    });
  });

  // ==========================================================================
  // Viewport Capture Tests
  // ==========================================================================

  describe('captureViewport', () => {
    it('should capture viewport successfully', async () => {
      const service = createMockScreenshotService();
      const { result } = renderHook(() =>
        useScreenCapture({ screenshotService: service })
      );

      let capturedData: string | null = null;

      await act(async () => {
        capturedData = await result.current.captureViewport();
      });

      expect(capturedData).toBe('data:image/png;base64,viewport-screenshot');
      expect(result.current.screenshot).toBe('data:image/png;base64,viewport-screenshot');
      expect(result.current.captureState).toBe('complete');
      expect(service.captureViewport).toHaveBeenCalled();
    });

    it('should transition to capturing state during viewport capture', async () => {
      let resolveFn: (value: string) => void;
      const service = createMockScreenshotService({
        captureViewport: vi.fn().mockImplementation(() => {
          return new Promise((resolve) => {
            resolveFn = resolve;
          });
        }),
      });

      const { result } = renderHook(() =>
        useScreenCapture({ screenshotService: service })
      );

      let capturePromise: Promise<string | null>;

      act(() => {
        capturePromise = result.current.captureViewport();
      });

      expect(result.current.captureState).toBe('capturing');
      expect(result.current.isCapturing).toBe(true);

      await act(async () => {
        resolveFn!('data:image/png;base64,resolved');
        await capturePromise;
      });

      expect(result.current.captureState).toBe('complete');
    });

    it('should call onCaptureComplete callback on viewport capture success', async () => {
      const service = createMockScreenshotService();
      const onCaptureComplete = vi.fn();
      const { result } = renderHook(() =>
        useScreenCapture({ screenshotService: service, onCaptureComplete })
      );

      await act(async () => {
        await result.current.captureViewport();
      });

      expect(onCaptureComplete).toHaveBeenCalledWith('data:image/png;base64,viewport-screenshot');
    });

    it('should handle viewport capture error', async () => {
      const error = new Error('Viewport capture failed');
      const service = createMockScreenshotService({
        captureViewport: vi.fn().mockRejectedValue(error),
      });
      const onCaptureError = vi.fn();
      const { result } = renderHook(() =>
        useScreenCapture({ screenshotService: service, onCaptureError })
      );

      await act(async () => {
        await result.current.captureViewport();
      });

      expect(result.current.captureState).toBe('error');
      expect(result.current.error).toBe(error);
      expect(onCaptureError).toHaveBeenCalledWith(error);
    });

    it('should return null if no service available for viewport capture', async () => {
      const onCaptureError = vi.fn();
      const { result } = renderHook(() =>
        useScreenCapture({ onCaptureError })
      );

      let capturedData: string | null;

      await act(async () => {
        capturedData = await result.current.captureViewport();
      });

      expect(capturedData!).toBeNull();
      expect(result.current.error?.message).toBe('Screenshot service not available');
    });

    it('should return null if already capturing when calling captureViewport', async () => {
      let resolveFn: (value: string) => void;
      const service = createMockScreenshotService({
        captureViewport: vi.fn().mockImplementation(() => {
          return new Promise((resolve) => {
            resolveFn = resolve;
          });
        }),
      });

      const { result } = renderHook(() =>
        useScreenCapture({ screenshotService: service })
      );

      let firstCapture: Promise<string | null>;
      let secondCapture: string | null;

      act(() => {
        firstCapture = result.current.captureViewport();
      });

      await act(async () => {
        secondCapture = await result.current.captureViewport();
      });

      expect(secondCapture!).toBeNull();
      expect(service.captureViewport).toHaveBeenCalledTimes(1);

      // Cleanup
      await act(async () => {
        resolveFn!('data');
        await firstCapture;
      });
    });
  });

  // ==========================================================================
  // Clear/Reset Tests
  // ==========================================================================

  describe('clear/reset', () => {
    it('should clear screenshot and reset state', async () => {
      const service = createMockScreenshotService();
      const { result } = renderHook(() =>
        useScreenCapture({ screenshotService: service })
      );

      // First capture something
      await act(async () => {
        await result.current.captureViewport();
      });

      expect(result.current.screenshot).not.toBeNull();
      expect(result.current.captureState).toBe('complete');

      // Clear
      act(() => {
        result.current.clear();
      });

      expect(result.current.screenshot).toBeNull();
      expect(result.current.captureState).toBe('idle');
      expect(result.current.error).toBeNull();
    });

    it('should clear error state', async () => {
      const error = new Error('Capture failed');
      const service = createMockScreenshotService({
        captureViewport: vi.fn().mockRejectedValue(error),
      });
      const { result } = renderHook(() =>
        useScreenCapture({ screenshotService: service })
      );

      // Trigger an error
      await act(async () => {
        await result.current.captureViewport();
      });

      expect(result.current.error).toBe(error);
      expect(result.current.captureState).toBe('error');

      // Clear
      act(() => {
        result.current.clear();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.captureState).toBe('idle');
    });

    it('should call onStateChange when clearing', async () => {
      const service = createMockScreenshotService();
      const onStateChange = vi.fn();
      const { result } = renderHook(() =>
        useScreenCapture({ screenshotService: service, onStateChange })
      );

      // Capture first
      await act(async () => {
        await result.current.captureViewport();
      });

      onStateChange.mockClear();

      // Clear
      act(() => {
        result.current.clear();
      });

      expect(onStateChange).toHaveBeenCalledWith('idle');
    });

    it('reset should be an alias for clear', async () => {
      const service = createMockScreenshotService();
      const { result } = renderHook(() =>
        useScreenCapture({ screenshotService: service })
      );

      await act(async () => {
        await result.current.captureViewport();
      });

      expect(result.current.screenshot).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.screenshot).toBeNull();
      expect(result.current.captureState).toBe('idle');
    });
  });

  // ==========================================================================
  // Multiple Capture Tests
  // ==========================================================================

  describe('multiple captures', () => {
    it('should replace previous screenshot on new capture', async () => {
      const service = createMockScreenshotService({
        captureViewport: vi.fn()
          .mockResolvedValueOnce('data:image/png;base64,first')
          .mockResolvedValueOnce('data:image/png;base64,second'),
      });
      const { result } = renderHook(() =>
        useScreenCapture({ screenshotService: service })
      );

      await act(async () => {
        await result.current.captureViewport();
      });

      expect(result.current.screenshot).toBe('data:image/png;base64,first');

      await act(async () => {
        await result.current.captureViewport();
      });

      expect(result.current.screenshot).toBe('data:image/png;base64,second');
    });

    it('should allow capture after error', async () => {
      const service = createMockScreenshotService({
        captureViewport: vi.fn()
          .mockRejectedValueOnce(new Error('First failed'))
          .mockResolvedValueOnce('data:image/png;base64,success'),
      });
      const { result } = renderHook(() =>
        useScreenCapture({ screenshotService: service })
      );

      // First capture fails
      await act(async () => {
        await result.current.captureViewport();
      });

      expect(result.current.captureState).toBe('error');
      expect(result.current.error).not.toBeNull();

      // Second capture succeeds
      await act(async () => {
        await result.current.captureViewport();
      });

      expect(result.current.captureState).toBe('complete');
      expect(result.current.error).toBeNull();
      expect(result.current.screenshot).toBe('data:image/png;base64,success');
    });
  });

  // ==========================================================================
  // Service Update Tests
  // ==========================================================================

  describe('service updates', () => {
    it('should use latest service on capture', async () => {
      const service1 = createMockScreenshotService({
        captureViewport: vi.fn().mockResolvedValue('data:service1'),
      });
      const service2 = createMockScreenshotService({
        captureViewport: vi.fn().mockResolvedValue('data:service2'),
      });

      const { result, rerender } = renderHook(
        ({ service }) => useScreenCapture({ screenshotService: service }),
        { initialProps: { service: service1 } }
      );

      // Capture with first service
      await act(async () => {
        await result.current.captureViewport();
      });

      expect(result.current.screenshot).toBe('data:service1');

      // Switch service
      rerender({ service: service2 });

      // Clear and capture with new service
      act(() => {
        result.current.clear();
      });

      await act(async () => {
        await result.current.captureViewport();
      });

      expect(result.current.screenshot).toBe('data:service2');
    });
  });
});
