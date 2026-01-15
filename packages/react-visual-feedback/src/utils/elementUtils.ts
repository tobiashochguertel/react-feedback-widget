/**
 * Element Utility Functions
 *
 * Pure functions for DOM element operations.
 *
 * @packageDocumentation
 */

import type { ElementPosition, ViewportInfo } from '../types';

/**
 * Get a CSS selector path for an element
 *
 * @param element - DOM element to get selector for
 * @returns CSS selector string
 *
 * @example
 * ```typescript
 * getElementSelector(document.querySelector('.my-button'));
 * // "div.container > button.my-button"
 * ```
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
      const classNameStr =
        typeof current.className === 'string'
          ? current.className
          : (current.className as SVGAnimatedString).baseVal || '';

      if (classNameStr) {
        const classes = classNameStr.split(' ').filter((c) => c.trim());
        if (classes.length > 0) {
          selector += `.${classes[0]}`;
        }
      }
    }

    const siblings = Array.from(current.parentElement?.children || []).filter(
      (el) => el.tagName === current?.tagName
    );

    if (siblings.length > 1) {
      const index = siblings.indexOf(current) + 1;
      selector += `:nth-of-type(${index})`;
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

/**
 * Get the bounding rectangle of an element relative to the viewport
 *
 * @param element - DOM element
 * @returns Position object with x, y, width, height
 */
export function getElementPosition(element: Element): ElementPosition {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * Get current viewport information
 *
 * @returns Viewport dimensions, scroll position, and pixel ratio
 */
export function getViewportInfo(): ViewportInfo {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    devicePixelRatio: window.devicePixelRatio,
  };
}

/**
 * Check if an element is visible in the viewport
 *
 * @param element - DOM element to check
 * @param threshold - Percentage of element that must be visible (0-1)
 * @returns true if element is visible
 */
export function isElementVisible(element: Element, threshold = 0): boolean {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  // Calculate visible area
  const visibleHeight =
    Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
  const visibleWidth =
    Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0);

  if (visibleHeight <= 0 || visibleWidth <= 0) return false;

  const visibleArea = visibleHeight * visibleWidth;
  const totalArea = rect.width * rect.height;

  return visibleArea / totalArea >= threshold;
}

/**
 * Get the text content of an element, truncated to a maximum length
 *
 * @param element - DOM element
 * @param maxLength - Maximum length of returned text
 * @returns Truncated text content
 */
export function getElementTextContent(
  element: Element,
  maxLength = 100
): string {
  const text = element.textContent?.trim() || '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Find the closest scrollable parent element
 *
 * @param element - Starting element
 * @returns Scrollable parent element or null
 */
export function findScrollableParent(element: Element): Element | null {
  let current: Element | null = element.parentElement;

  while (current) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    const overflowX = style.overflowX;

    if (
      overflowY === 'scroll' ||
      overflowY === 'auto' ||
      overflowX === 'scroll' ||
      overflowX === 'auto'
    ) {
      return current;
    }

    current = current.parentElement;
  }

  return document.documentElement;
}

/**
 * Format a file path for display (show relative path from src/)
 *
 * @param path - Full file path
 * @returns Shortened display path
 *
 * @example
 * ```typescript
 * formatPath('/Users/dev/project/src/components/Button.tsx');
 * // "src/components/Button.tsx"
 * ```
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
