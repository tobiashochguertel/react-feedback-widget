/**
 * React Visual Feedback - useScreenCapture Hook
 *
 * Custom hook for managing screenshot capture functionality.
 * This hook implements the Interface Segregation Principle by providing
 * a focused API for screenshot capture control.
 *
 * @packageDocumentation
 */

import { useState, useCallback, useMemo, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Screenshot service interface for dependency injection
 */
export interface ScreenshotService {
  /**
   * Capture a screenshot of a specific element
   * @param element - The HTML element to capture
   * @returns Promise resolving to base64-encoded image data
   */
  captureElement: (element: HTMLElement) => Promise<string>;

  /**
   * Capture a screenshot of the entire viewport
   * @returns Promise resolving to base64-encoded image data
   */
  captureViewport: () => Promise<string>;

  /**
   * Check if screenshot capture is supported
   */
  isSupported: () => boolean;
}

/**
 * Capture state enum
 */
export type CaptureState = 'idle' | 'capturing' | 'complete' | 'error';

/**
 * Options for the useScreenCapture hook
 */
export interface UseScreenCaptureOptions {
  /**
   * Screenshot service instance for dependency injection.
   * If not provided, capture operations will not be available.
   */
  screenshotService?: ScreenshotService;

  /**
   * Callback invoked when capture completes successfully.
   */
  onCaptureComplete?: (screenshot: string) => void;

  /**
   * Callback invoked when a capture error occurs.
   */
  onCaptureError?: (error: Error) => void;

  /**
   * Callback invoked when capture state changes.
   */
  onStateChange?: (state: CaptureState) => void;
}

/**
 * Return type of the useScreenCapture hook
 */
export interface UseScreenCaptureReturn {
  /** Current capture state */
  captureState: CaptureState;

  /** Whether a capture is currently in progress */
  isCapturing: boolean;

  /** Whether capture service is supported */
  isSupported: boolean;

  /** The captured screenshot (base64-encoded, available after capture completes) */
  screenshot: string | null;

  /** Error that occurred during capture (if any) */
  error: Error | null;

  /**
   * Capture a screenshot of a specific element
   * @param element - The HTML element to capture
   * @returns Promise resolving to the screenshot data
   */
  capture: (element: HTMLElement) => Promise<string | null>;

  /**
   * Capture a screenshot of the entire viewport
   * @returns Promise resolving to the screenshot data
   */
  captureViewport: () => Promise<string | null>;

  /** Clear the current screenshot and reset to idle state */
  clear: () => void;

  /** Reset the capture state (alias for clear) */
  reset: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing screenshot capture functionality.
 *
 * Provides methods for capturing elements or the full viewport:
 * - capture: Capture a specific element
 * - captureViewport: Capture the full viewport
 * - clear/reset: Clear the captured screenshot
 *
 * @example
 * ```tsx
 * function CaptureButton() {
 *   const { capture, screenshot, isCapturing, clear } = useScreenCapture({
 *     screenshotService: myScreenshotService,
 *     onCaptureComplete: (data) => {
 *       console.log('Screenshot captured!');
 *     },
 *   });
 *
 *   const handleCapture = async () => {
 *     const element = document.getElementById('target-element');
 *     if (element) {
 *       await capture(element);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleCapture} disabled={isCapturing}>
 *         {isCapturing ? 'Capturing...' : 'Capture'}
 *       </button>
 *       {screenshot && <img src={screenshot} alt="Screenshot" />}
 *       {screenshot && <button onClick={clear}>Clear</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useScreenCapture(options: UseScreenCaptureOptions = {}): UseScreenCaptureReturn {
  const {
    screenshotService,
    onCaptureComplete,
    onCaptureError,
    onStateChange,
  } = options;

  // State
  const [captureState, setCaptureState] = useState<CaptureState>('idle');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Ref to track if screenshot service is available
  const serviceRef = useRef(screenshotService);
  serviceRef.current = screenshotService;

  // Helper to update state and notify
  const updateState = useCallback((newState: CaptureState) => {
    setCaptureState(newState);
    onStateChange?.(newState);
  }, [onStateChange]);

  // Derived states
  const isCapturing = captureState === 'capturing';
  const isSupported = screenshotService?.isSupported?.() ?? false;

  // Capture element
  const capture = useCallback(async (element: HTMLElement): Promise<string | null> => {
    if (!serviceRef.current) {
      const err = new Error('Screenshot service not available');
      setError(err);
      onCaptureError?.(err);
      return null;
    }

    if (captureState === 'capturing') {
      return null; // Already capturing
    }

    try {
      setError(null);
      updateState('capturing');

      const data = await serviceRef.current.captureElement(element);

      setScreenshot(data);
      updateState('complete');
      onCaptureComplete?.(data);

      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      updateState('error');
      onCaptureError?.(error);
      return null;
    }
  }, [captureState, updateState, onCaptureComplete, onCaptureError]);

  // Capture viewport
  const captureViewport = useCallback(async (): Promise<string | null> => {
    if (!serviceRef.current) {
      const err = new Error('Screenshot service not available');
      setError(err);
      onCaptureError?.(err);
      return null;
    }

    if (captureState === 'capturing') {
      return null; // Already capturing
    }

    try {
      setError(null);
      updateState('capturing');

      const data = await serviceRef.current.captureViewport();

      setScreenshot(data);
      updateState('complete');
      onCaptureComplete?.(data);

      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      updateState('error');
      onCaptureError?.(error);
      return null;
    }
  }, [captureState, updateState, onCaptureComplete, onCaptureError]);

  // Clear/reset
  const clear = useCallback(() => {
    setScreenshot(null);
    setError(null);
    updateState('idle');
  }, [updateState]);

  // Memoize return value
  return useMemo(
    () => ({
      captureState,
      isCapturing,
      isSupported,
      screenshot,
      error,
      capture,
      captureViewport,
      clear,
      reset: clear, // Alias
    }),
    [
      captureState,
      isCapturing,
      isSupported,
      screenshot,
      error,
      capture,
      captureViewport,
      clear,
    ]
  );
}

// Re-export types for convenience
export type {
  UseScreenCaptureOptions,
  UseScreenCaptureReturn,
  ScreenshotService,
  CaptureState,
};
