/**
 * Modern Screenshot Service Implementation
 *
 * Implements ScreenshotService interface using the modern-screenshot library.
 * Falls back to html2canvas if modern-screenshot fails.
 *
 * @packageDocumentation
 */

import type {
  ScreenshotService,
  ScreenshotOptions,
  ScreenshotResult,
  SelectionArea,
} from './ScreenshotService';

// Dynamic imports to handle optional dependencies
let domToPng: ((node: HTMLElement, options?: object) => Promise<string>) | null = null;
let domToBlob: ((node: HTMLElement, options?: object) => Promise<Blob>) | null = null;
let html2canvas: ((element: HTMLElement, options?: object) => Promise<HTMLCanvasElement>) | null = null;

/**
 * Default screenshot options
 */
const DEFAULT_OPTIONS: ScreenshotOptions = {
  scale: window?.devicePixelRatio || 1,
  backgroundColor: '#ffffff',
  quality: 0.95,
  format: 'png',
  includePseudoElements: true,
  timeout: 30000,
};

/**
 * Modern Screenshot service implementation
 *
 * Uses modern-screenshot for high-quality captures with html2canvas fallback.
 *
 * @example
 * ```typescript
 * const screenshot = new ModernScreenshotService();
 * const result = await screenshot.capture(element, { format: 'jpeg', quality: 0.8 });
 * if (result.success) {
 *   console.log('Screenshot captured:', result.dataUrl);
 * }
 * ```
 */
export class ModernScreenshotService implements ScreenshotService {
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the screenshot libraries
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this.loadLibraries();
    await this.initPromise;
    this.initialized = true;
  }

  /**
   * Load screenshot libraries dynamically
   */
  private async loadLibraries(): Promise<void> {
    try {
      // Try to load modern-screenshot
      const modernScreenshot = await import('modern-screenshot');
      domToPng = modernScreenshot.domToPng;
      domToBlob = modernScreenshot.domToBlob;
    } catch {
      // modern-screenshot not available
    }

    try {
      // Try to load html2canvas as fallback
      const html2canvasModule = await import('html2canvas');
      html2canvas = html2canvasModule.default;
    } catch {
      // html2canvas not available
    }
  }

  /**
   * Capture a screenshot of an element
   */
  async capture(
    element: HTMLElement,
    options?: ScreenshotOptions
  ): Promise<ScreenshotResult> {
    const startTime = Date.now();
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      await this.initialize();

      let dataUrl: string;
      let blob: Blob | undefined;

      // Try modern-screenshot first
      if (domToPng) {
        dataUrl = await domToPng(element, {
          scale: opts.scale,
          backgroundColor: opts.backgroundColor,
          quality: opts.quality,
        });

        if (domToBlob) {
          blob = await domToBlob(element, {
            scale: opts.scale,
            backgroundColor: opts.backgroundColor,
            quality: opts.quality,
          });
        }
      } else if (html2canvas) {
        // Fallback to html2canvas
        const canvas = await html2canvas(element, {
          scale: opts.scale,
          backgroundColor: opts.backgroundColor,
          useCORS: true,
          allowTaint: true,
        });

        dataUrl = canvas.toDataURL(this.getMimeType(opts.format), opts.quality);
        blob = await this.canvasToBlob(canvas, opts.format, opts.quality);
      } else {
        throw new Error('No screenshot library available');
      }

      const mimeType = this.getMimeType(opts.format);

      return {
        success: true,
        dataUrl,
        ...(blob !== undefined && { blob }),
        width: element.offsetWidth,
        height: element.offsetHeight,
        mimeType,
        ...(blob?.size !== undefined && { size: blob.size }),
        captureTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Screenshot capture failed',
        captureTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Capture the full page
   */
  async capturePage(options?: ScreenshotOptions): Promise<ScreenshotResult> {
    const element = document.documentElement || document.body;
    return this.capture(element, options);
  }

  /**
   * Capture a specific area of the page
   */
  async captureArea(
    area: SelectionArea,
    options?: ScreenshotOptions
  ): Promise<ScreenshotResult> {
    const startTime = Date.now();
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      // First capture the full page
      const pageResult = await this.capturePage(opts);

      if (!pageResult.success || !pageResult.dataUrl) {
        return pageResult;
      }

      // Then crop to the area
      const croppedDataUrl = await this.crop(pageResult.dataUrl, area);
      const blob = await this.dataUrlToBlob(croppedDataUrl);

      return {
        success: true,
        dataUrl: croppedDataUrl,
        blob,
        width: area.width,
        height: area.height,
        mimeType: this.getMimeType(opts.format),
        size: blob.size,
        captureTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Area capture failed',
        captureTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Crop an existing screenshot to a selection area
   */
  async crop(dataUrl: string, selection: SelectionArea): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = selection.width;
        canvas.height = selection.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(
          img,
          selection.x,
          selection.y,
          selection.width,
          selection.height,
          0,
          0,
          selection.width,
          selection.height
        );

        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for cropping'));
      };

      img.src = dataUrl;
    });
  }

  /**
   * Convert a data URL to a Blob
   */
  async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return response.blob();
  }

  /**
   * Check if screenshot service is available
   */
  isSupported(): boolean {
    return typeof document !== 'undefined' && typeof Image !== 'undefined';
  }

  /**
   * Get supported output formats
   */
  getSupportedFormats(): string[] {
    return ['png', 'jpeg', 'webp'];
  }

  /**
   * Get MIME type for format
   */
  private getMimeType(format?: 'png' | 'jpeg' | 'webp'): string {
    switch (format) {
      case 'jpeg':
        return 'image/jpeg';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/png';
    }
  }

  /**
   * Convert canvas to blob
   */
  private canvasToBlob(
    canvas: HTMLCanvasElement,
    format?: 'png' | 'jpeg' | 'webp',
    quality?: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        this.getMimeType(format),
        quality
      );
    });
  }
}
