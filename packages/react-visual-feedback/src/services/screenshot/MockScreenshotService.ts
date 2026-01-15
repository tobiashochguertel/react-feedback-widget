/**
 * Mock Screenshot Service Implementation
 *
 * Implements ScreenshotService interface for testing purposes.
 * Returns configurable mock data without actual screenshot capture.
 *
 * @packageDocumentation
 */

import type {
  ScreenshotService,
  ScreenshotOptions,
  ScreenshotResult,
  SelectionArea,
} from './ScreenshotService';

/**
 * Minimal 1x1 transparent PNG as base64
 */
const TRANSPARENT_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * Mock screenshot service for testing
 *
 * Simulates screenshot capture without accessing browser APIs.
 * Useful for unit tests and development environments.
 *
 * @example
 * ```typescript
 * const screenshot = new MockScreenshotService();
 * screenshot.mockDataUrl = 'data:image/png;base64,...';
 * const result = await screenshot.capture(element);
 * ```
 */
export class MockScreenshotService implements ScreenshotService {
  // Mock data - set these before calling capture methods
  public mockDataUrl: string = TRANSPARENT_PNG;
  public mockBlob: Blob | null = null;
  public mockShouldFail: boolean = false;
  public mockError: string = 'Mock screenshot error';
  public mockCaptureDelay: number = 10;

  // Call tracking for testing
  public captureCallCount: number = 0;
  public lastCaptureElement: HTMLElement | null = null;
  public lastCaptureOptions: ScreenshotOptions | undefined;

  /**
   * Reset all mock state
   */
  reset(): void {
    this.mockDataUrl = TRANSPARENT_PNG;
    this.mockBlob = null;
    this.mockShouldFail = false;
    this.mockError = 'Mock screenshot error';
    this.mockCaptureDelay = 10;
    this.captureCallCount = 0;
    this.lastCaptureElement = null;
    this.lastCaptureOptions = undefined;
  }

  /**
   * Capture a screenshot of an element (mock)
   */
  async capture(
    element: HTMLElement,
    options?: ScreenshotOptions
  ): Promise<ScreenshotResult> {
    const startTime = Date.now();

    // Track calls for testing
    this.captureCallCount++;
    this.lastCaptureElement = element;
    this.lastCaptureOptions = options;

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, this.mockCaptureDelay));

    if (this.mockShouldFail) {
      return {
        success: false,
        error: this.mockError,
        captureTime: Date.now() - startTime,
      };
    }

    const blob = this.mockBlob || (await this.dataUrlToBlob(this.mockDataUrl));

    return {
      success: true,
      dataUrl: this.mockDataUrl,
      blob,
      width: element?.offsetWidth || 100,
      height: element?.offsetHeight || 100,
      mimeType: 'image/png',
      size: blob.size,
      captureTime: Date.now() - startTime,
    };
  }

  /**
   * Capture the full page (mock)
   */
  async capturePage(options?: ScreenshotOptions): Promise<ScreenshotResult> {
    // Create a mock element representing the page
    const mockElement = {
      offsetWidth: window?.innerWidth || 1920,
      offsetHeight: window?.innerHeight || 1080,
    } as HTMLElement;

    return this.capture(mockElement, options);
  }

  /**
   * Capture a specific area of the page (mock)
   */
  async captureArea(
    area: SelectionArea,
    options?: ScreenshotOptions
  ): Promise<ScreenshotResult> {
    const startTime = Date.now();

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, this.mockCaptureDelay));

    if (this.mockShouldFail) {
      return {
        success: false,
        error: this.mockError,
        captureTime: Date.now() - startTime,
      };
    }

    const blob = this.mockBlob || (await this.dataUrlToBlob(this.mockDataUrl));

    return {
      success: true,
      dataUrl: this.mockDataUrl,
      blob,
      width: area.width,
      height: area.height,
      mimeType: options?.format ? `image/${options.format}` : 'image/png',
      size: blob.size,
      captureTime: Date.now() - startTime,
    };
  }

  /**
   * Crop a screenshot (mock - returns the same data URL)
   */
  async crop(_dataUrl: string, _selection: SelectionArea): Promise<string> {
    // In the mock, just return the same mock data URL
    return this.mockDataUrl;
  }

  /**
   * Convert a data URL to a Blob
   */
  async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    // For mock, create a simple blob
    const response = await fetch(dataUrl);
    return response.blob();
  }

  /**
   * Mock always returns true for support check
   */
  isSupported(): boolean {
    return true;
  }

  /**
   * Return mock supported formats
   */
  getSupportedFormats(): string[] {
    return ['png', 'jpeg', 'webp'];
  }

  /**
   * Create a mock data URL with specific dimensions
   *
   * @param width - Width in pixels
   * @param height - Height in pixels
   * @param color - Fill color (default: transparent)
   */
  createMockDataUrl(width: number, height: number, color?: string): string {
    if (typeof document === 'undefined') {
      return TRANSPARENT_PNG;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx && color) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
    }

    return canvas.toDataURL('image/png');
  }
}
