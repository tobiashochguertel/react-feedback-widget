/**
 * Utility functions for react-visual-feedback
 */

import { domToPng, type Options as DomToPngOptions } from 'modern-screenshot';
import type {
  ElementInfo,
  ElementPosition,
  ElementStyles,
  ReactComponentInfo,
  ReactComponentSourceInfo,
  ViewportInfo,
} from './types/index.js';

// =====================================================================
// PART 1: METADATA & COMPONENT DETECTION
// =====================================================================

/**
 * Gets a CSS selector path for an element
 */
export function getElementSelector(element: Element): string {
  if (!element || element === document.body) return 'body';
  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }

    if (current.className) {
      // Handle both HTML elements (string) and SVG elements (SVGAnimatedString)
      const classNameStr = typeof current.className === 'string'
        ? current.className
        : (current.className as SVGAnimatedString).baseVal || '';

      if (classNameStr) {
        const classes = classNameStr.split(' ').filter((c) => c.trim());
        if (classes.length > 0) {
          selector += `.${classes[0]}`;
        }
      }
    }

    const siblings = Array.from(current.parentElement?.children || [])
      .filter((el) => el.tagName === current?.tagName);

    if (siblings.length > 1) {
      const index = siblings.indexOf(current) + 1;
      selector += `:nth-of-type(${index})`;
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

// Internal component name validation
const INTERNAL_COMPONENT_NAMES = [
  'Fragment', 'Suspense', 'StrictMode', 'Profiler',
  'Provider', 'Consumer', 'Context', 'Portal',
  'ForwardRef', 'Memo', 'Lazy'
];

/**
 * Check if a component name is valid (not minified or internal)
 */
function isValidComponentName(name: string | null | undefined): boolean {
  if (!name) return false;
  if (name.length < 3) return false;
  if (name[0] === name[0].toLowerCase() && name[0] !== name[0].toUpperCase()) return false;
  if (INTERNAL_COMPONENT_NAMES.includes(name)) return false;
  if (name.startsWith('_')) return false;
  return true;
}

// React Fiber type (minimal definition for what we need)
interface ReactFiber {
  type?: unknown;
  return?: ReactFiber | null | undefined;
  memoizedProps?: Record<string, unknown> | null | undefined;
  _debugSource?: ReactComponentSourceInfo | undefined;
}

/**
 * Try to get source file path from React DevTools data
 */
function getComponentSourceInfo(fiber: ReactFiber): ReactComponentSourceInfo | null {
  try {
    if (fiber._debugSource) {
      return {
        fileName: fiber._debugSource.fileName,
        lineNumber: fiber._debugSource.lineNumber,
        columnNumber: fiber._debugSource.columnNumber
      };
    }
    const props = fiber.memoizedProps;
    if (props && typeof props === 'object' && '__source' in props) {
      const source = props.__source as ReactComponentSourceInfo;
      return {
        fileName: source.fileName,
        lineNumber: source.lineNumber
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get React component info from a DOM element
 */
export function getReactComponentInfo(element: HTMLElement | null): ReactComponentInfo | null {
  if (!element) return null;

  const componentInfo: ReactComponentInfo = {
    componentName: null,
    componentStack: [],
    props: null,
    sourceFile: null
  };

  try {
    const fiberKey = Object.keys(element).find(
      (key) => key.startsWith('__reactFiber$') ||
        key.startsWith('__reactInternalInstance$')
    );

    if (fiberKey) {
      let fiber: ReactFiber | null | undefined = (element as unknown as Record<string, ReactFiber>)[fiberKey];
      let depth = 0;
      const maxDepth = 20;

      while (fiber && depth < maxDepth) {
        depth++;

        if (fiber.type) {
          let componentName: string | null = null;
          let sourceInfo: ReactComponentSourceInfo | null = null;

          if (typeof fiber.type === 'function') {
            const funcType = fiber.type as { displayName?: string; name?: string };
            componentName = funcType.displayName || funcType.name || null;
            sourceInfo = getComponentSourceInfo(fiber);
          } else if (typeof fiber.type === 'object' && fiber.type !== null) {
            const objType = fiber.type as {
              displayName?: string;
              render?: { displayName?: string; name?: string };
              type?: { displayName?: string; name?: string };
            };
            if (objType.displayName) {
              componentName = objType.displayName;
            } else if (objType.render?.displayName || objType.render?.name) {
              componentName = objType.render.displayName || objType.render.name || null;
            } else if (objType.type?.displayName || objType.type?.name) {
              componentName = objType.type.displayName || objType.type.name || null;
            }
            sourceInfo = getComponentSourceInfo(fiber);
          }

          if (isValidComponentName(componentName)) {
            if (!componentInfo.componentName) {
              componentInfo.componentName = componentName;
              componentInfo.sourceFile = sourceInfo;

              if (fiber.memoizedProps) {
                try {
                  const safeProps: Record<string, unknown> = {};
                  for (const [key, value] of Object.entries(fiber.memoizedProps)) {
                    if (key.startsWith('__') || key === 'children') continue;
                    if (typeof value === 'string' ||
                      typeof value === 'number' ||
                      typeof value === 'boolean' ||
                      value === null ||
                      value === undefined) {
                      safeProps[key] = value;
                    }
                  }
                  if (Object.keys(safeProps).length > 0) {
                    componentInfo.props = safeProps;
                  }
                } catch {
                  // Ignore props extraction errors
                }
              }
            }

            if (componentInfo.componentStack.length < 5 &&
              componentName &&
              !componentInfo.componentStack.includes(componentName)) {
              componentInfo.componentStack.push(componentName);
            }
          }
        }
        fiber = fiber.return;
      }
    }
  } catch {
    // Could not detect React component
  }

  return componentInfo.componentName ? componentInfo : null;
}

/**
 * Get detailed info about a DOM element
 */
export function getElementInfo(element: HTMLElement): ElementInfo {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);

  const className = element.className
    ? (typeof element.className === 'string' ? element.className : (element.className as unknown as SVGAnimatedString).baseVal || '')
    : null;

  const reactInfo = getReactComponentInfo(element);

  const position: ElementPosition = {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  };

  const styles: ElementStyles = {
    backgroundColor: computedStyle.backgroundColor,
    color: computedStyle.color,
    fontSize: computedStyle.fontSize,
    fontFamily: computedStyle.fontFamily
  };

  return {
    tagName: element.tagName.toLowerCase(),
    id: element.id || null,
    className: className,
    textContent: element.textContent?.slice(0, 100) || null,
    selector: getElementSelector(element),
    position,
    styles,
    reactComponent: reactInfo || undefined
  };
}

/**
 * Get current viewport information
 */
export function getViewportInfo(): ViewportInfo {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    devicePixelRatio: window.devicePixelRatio || 1
  };
}

// =====================================================================
// PART 2: OPTIMIZED SCREENSHOT LOGIC
// =====================================================================

/**
 * Finds the "Visual Context" element.
 * If you click a transparent text span, this finds the Card/Container behind it.
 */
function getContextElement(element: HTMLElement): HTMLElement {
  let current: HTMLElement | null = element;

  // If we selected the body/html, return body immediately
  if (!current || current === document.body || current === document.documentElement) {
    return document.body;
  }

  // Walk up to find a container with a defined background
  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const bgColor = style.backgroundColor;
    const bgImage = style.backgroundImage;

    // Check if this element actually "paints" something
    const hasVisibleBg =
      (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') ||
      (bgImage && bgImage !== 'none');

    // Also check for shadows (common in cards)
    const hasShadow = style.boxShadow && style.boxShadow !== 'none';

    if (hasVisibleBg || hasShadow) {
      return current;
    }
    current = current.parentElement as HTMLElement | null;
  }

  // Fallback
  return element.parentElement as HTMLElement || document.body;
}

/**
 * Smart Crop - ensures we only get the visible part of the element
 */
function cropImageToSelection(
  dataUrl: string,
  contextRect: DOMRect,
  selectionRect: DOMRect,
  scale: number
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Calculate intersection: The target relative to the Context
      let sourceX = selectionRect.left - contextRect.left;
      let sourceY = selectionRect.top - contextRect.top;
      let sourceW = selectionRect.width;
      let sourceH = selectionRect.height;

      // Handle Negative Offsets (if content is scrolled out of view)
      if (sourceX < 0) { sourceW += sourceX; sourceX = 0; }
      if (sourceY < 0) { sourceH += sourceY; sourceY = 0; }

      // Clamp dimensions to the actual image size
      const maxW = (img.width / scale) - sourceX;
      const maxH = (img.height / scale) - sourceY;

      sourceW = Math.min(sourceW, maxW);
      sourceH = Math.min(sourceH, maxH);

      // Apply Scale (Retina/High DPI)
      const sX = sourceX * scale;
      const sY = sourceY * scale;
      const sW = sourceW * scale;
      const sH = sourceH * scale;

      if (sW <= 0 || sH <= 0) {
        resolve(dataUrl);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = sW;
      canvas.height = sH;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(
          img,
          sX, sY, sW, sH,  // Source Crop
          0, 0, sW, sH     // Destination
        );
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Capture a screenshot of an element
 */
export async function captureElementScreenshot(element: HTMLElement | null): Promise<string | null> {
  if (!element) return null;

  // Get Geometry of the specific thing user clicked
  const selectionRect = element.getBoundingClientRect();

  // Find the Context (Parent with Background)
  const contextElement = getContextElement(element);
  const contextRect = contextElement.getBoundingClientRect();

  // High Quality Scale
  const SCALE = 3;

  // Configuration
  const isBody = contextElement === document.body || contextElement === document.documentElement;

  interface CaptureOptions {
    scale: number;
    backgroundColor: null;
    style: Record<string, string>;
    filter: (node: Element) => boolean;
    width?: number | undefined;
    height?: number | undefined;
  }

  const captureOptions: CaptureOptions = {
    scale: SCALE,
    backgroundColor: null,
    style: {
      transform: 'none',
      opacity: '1',
      transition: 'none'
    },
    filter: (node: Element) => {
      if (node.classList) {
        return !node.classList.contains('feedback-overlay') &&
          !node.classList.contains('feedback-modal') &&
          !node.classList.contains('feedback-highlight');
      }
      return true;
    }
  };

  // If capturing the whole page/body, RESTRICT to window dimensions
  if (isBody) {
    captureOptions.width = window.innerWidth;
    captureOptions.height = window.innerHeight;
    captureOptions.style.height = `${window.innerHeight}px`;
    captureOptions.style.overflow = 'hidden';
  }

  try {
    // Capture
    const dataUrl = await domToPng(contextElement, captureOptions as unknown as DomToPngOptions);

    if (dataUrl) {
      // If we captured the Body, we are done
      if (isBody) {
        return dataUrl;
      }

      // If we captured a Card/Container, Crop it to the specific element selected
      if (contextElement !== element) {
        return await cropImageToSelection(
          dataUrl,
          contextRect,
          selectionRect,
          SCALE
        );
      }

      return dataUrl;
    }
  } catch {
    // Screenshot failed
  }

  return null;
}

/**
 * Format a file path for display
 */
export function formatPath(path: string | null | undefined): string {
  if (!path) return 'Unknown';

  // Try to grab everything after 'src' or 'components'
  const match = path.match(/(src\/.*|components\/.*)/);
  if (match) return match[0];

  // Fallback: just show the last 3 parts of the path
  const parts = path.split('/');
  if (parts.length > 3) {
    return '.../' + parts.slice(-3).join('/');
  }
  return path;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Convert data URL to Blob
 */
export async function dataURLToBlob(dataURL: string): Promise<Blob | null> {
  try {
    const response = await fetch(dataURL);
    return await response.blob();
  } catch {
    return null;
  }
}
