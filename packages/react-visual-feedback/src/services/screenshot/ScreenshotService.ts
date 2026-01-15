/**
 * Screenshot Service Interface
 *
 * Abstract interface for capturing screenshots of DOM elements.
 * Implementations can use html2canvas, modern-screenshot, or other libraries.
 *
 * @packageDocumentation
 */

/**
 * Screenshot capture options
 */
export interface ScreenshotOptions {
  /** Scale factor for the screenshot (1 = 100%) */
  scale?: number;
  /** Background color for transparent areas */
  backgroundColor?: string;
  /** Quality for JPEG output (0-1) */
  quality?: number;
  /** Output format */
  format?: 'png' | 'jpeg' | 'webp';
  /** Whether to include CSS pseudo-elements */
  includePseudoElements?: boolean;
  /** Whether to skip elements with certain selectors */
  skipSelectors?: string[];
  /** Custom CSS to apply before capture */
  customStyles?: string;
  /** Maximum width for the output */
  maxWidth?: number;
  /** Maximum height for the output */
  maxHeight?: number;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Selection area for cropping screenshots
 */
export interface SelectionArea {
  /** X coordinate of selection start */
  x: number;
  /** Y coordinate of selection start */
  y: number;
  /** Width of selection */
  width: number;
  /** Height of selection */
  height: number;
}

/**
 * Screenshot result after capture
 */
export interface ScreenshotResult {
  /** Success status */
  success: boolean;
  /** Data URL of the screenshot */
  dataUrl?: string;
  /** Screenshot as a Blob */
  blob?: Blob;
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** MIME type */
  mimeType?: string;
  /** File size in bytes */
  size?: number;
  /** Error message if failed */
  error?: string;
  /** Time taken to capture in milliseconds */
  captureTime?: number;
}

/**
 * Screenshot service interface
 *
 * Provides methods for capturing and processing screenshots of DOM elements.
 */
export interface ScreenshotService {
  /**
   * Capture a screenshot of an element
   *
   * @param element - DOM element to capture
   * @param options - Capture options
   * @returns Promise resolving to the screenshot result
   */
  capture(
    element: HTMLElement,
    options?: ScreenshotOptions
  ): Promise<ScreenshotResult>;

  /**
   * Capture the full page
   *
   * @param options - Capture options
   * @returns Promise resolving to the screenshot result
   */
  capturePage(options?: ScreenshotOptions): Promise<ScreenshotResult>;

  /**
   * Capture a specific area of the page
   *
   * @param area - Selection area to capture
   * @param options - Capture options
   * @returns Promise resolving to the screenshot result
   */
  captureArea(
    area: SelectionArea,
    options?: ScreenshotOptions
  ): Promise<ScreenshotResult>;

  /**
   * Crop an existing screenshot to a selection area
   *
   * @param dataUrl - Source screenshot data URL
   * @param selection - Area to crop to
   * @returns Promise resolving to cropped data URL
   */
  crop(dataUrl: string, selection: SelectionArea): Promise<string>;

  /**
   * Convert a data URL to a Blob
   *
   * @param dataUrl - Data URL to convert
   * @returns Promise resolving to Blob
   */
  dataUrlToBlob(dataUrl: string): Promise<Blob>;

  /**
   * Check if screenshot service is available
   */
  isSupported(): boolean;

  /**
   * Get supported output formats
   */
  getSupportedFormats(): string[];
}
