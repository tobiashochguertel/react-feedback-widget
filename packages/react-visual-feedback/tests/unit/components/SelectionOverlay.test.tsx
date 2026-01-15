/**
 * SelectionOverlay Component Tests
 *
 * Tests for the selection overlay component including:
 * - Rendering and visibility
 * - Mouse event handling
 * - Keyboard event handling (escape to cancel)
 * - Portal rendering
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import React from 'react';
import {
  SelectionOverlay,
  calculateHighlightStyle,
  calculateTooltipStyle,
  shouldIgnoreElement,
} from '../../../src/components/Overlay/SelectionOverlay';

// ============================================
// MOCKS & FIXTURES
// ============================================

const mockTheme = {
  colors: {
    overlayBg: 'rgba(0, 0, 0, 0.1)',
    highlightBorder: '#3b82f6',
    highlightBg: 'rgba(59, 130, 246, 0.1)',
    tooltipBg: 'rgba(17, 24, 39, 0.95)',
    tooltipText: '#ffffff',
  },
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      {component}
    </ThemeProvider>
  );
};

// ============================================
// TEST SUITES
// ============================================

describe('SelectionOverlay', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('should not render when isActive is false', () => {
      renderWithTheme(
        <SelectionOverlay isActive={false} />
      );

      expect(screen.queryByTestId('selection-overlay')).not.toBeInTheDocument();
    });

    it('should render when isActive is true', () => {
      renderWithTheme(
        <SelectionOverlay isActive={true} />
      );

      expect(screen.getByTestId('selection-overlay')).toBeInTheDocument();
    });

    it('should render with custom testId', () => {
      renderWithTheme(
        <SelectionOverlay isActive={true} testId="custom-overlay" />
      );

      expect(screen.getByTestId('custom-overlay')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      renderWithTheme(
        <SelectionOverlay isActive={true} className="custom-class" />
      );

      const overlay = screen.getByTestId('selection-overlay');
      expect(overlay).toHaveClass('custom-class');
    });

    it('should render in portal by default', () => {
      renderWithTheme(
        <SelectionOverlay isActive={true} />
      );

      const overlay = screen.getByTestId('selection-overlay');
      expect(overlay.parentElement).toBe(document.body);
    });

    it('should render without portal when usePortal is false', () => {
      const { container } = renderWithTheme(
        <SelectionOverlay isActive={true} usePortal={false} />
      );

      const overlay = screen.getByTestId('selection-overlay');
      expect(container.contains(overlay)).toBe(true);
    });

    it('should have data-feedback-overlay attribute', () => {
      renderWithTheme(
        <SelectionOverlay isActive={true} />
      );

      const overlay = screen.getByTestId('selection-overlay');
      expect(overlay).toHaveAttribute('data-feedback-overlay', 'true');
    });
  });

  describe('Keyboard Events', () => {
    it('should call onCancel when Escape key is pressed', () => {
      const onCancel = vi.fn();
      renderWithTheme(
        <SelectionOverlay isActive={true} onCancel={onCancel} />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel for other keys', () => {
      const onCancel = vi.fn();
      renderWithTheme(
        <SelectionOverlay isActive={true} onCancel={onCancel} />
      );

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });
      fireEvent.keyDown(document, { key: 'a' });

      expect(onCancel).not.toHaveBeenCalled();
    });

    it('should not call onCancel when overlay is inactive', () => {
      const onCancel = vi.fn();
      renderWithTheme(
        <SelectionOverlay isActive={false} onCancel={onCancel} />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('Z-Index', () => {
    it('should use default z-index of 999998', () => {
      renderWithTheme(
        <SelectionOverlay isActive={true} />
      );

      const overlay = screen.getByTestId('selection-overlay');
      expect(overlay).toHaveStyle({ zIndex: '999998' });
    });

    it('should use custom z-index when provided', () => {
      renderWithTheme(
        <SelectionOverlay isActive={true} zIndex={500000} />
      );

      const overlay = screen.getByTestId('selection-overlay');
      expect(overlay).toHaveStyle({ zIndex: '500000' });
    });
  });
});

describe('calculateHighlightStyle', () => {
  it('should calculate correct position and dimensions', () => {
    const mockElement = {
      getBoundingClientRect: () => ({
        top: 100,
        left: 200,
        width: 150,
        height: 50,
        right: 350,
        bottom: 150,
        x: 200,
        y: 100,
        toJSON: () => { },
      }),
    } as HTMLElement;

    const result = calculateHighlightStyle(mockElement);

    // Should include 4px padding
    expect(result.top).toBe(96);
    expect(result.left).toBe(196);
    expect(result.width).toBe(158);
    expect(result.height).toBe(58);
  });

  it('should not allow negative top position', () => {
    const mockElement = {
      getBoundingClientRect: () => ({
        top: 2,
        left: 50,
        width: 100,
        height: 30,
        right: 150,
        bottom: 32,
        x: 50,
        y: 2,
        toJSON: () => { },
      }),
    } as HTMLElement;

    const result = calculateHighlightStyle(mockElement);

    expect(result.top).toBeGreaterThanOrEqual(0);
  });

  it('should not allow negative left position', () => {
    const mockElement = {
      getBoundingClientRect: () => ({
        top: 50,
        left: 2,
        width: 100,
        height: 30,
        right: 102,
        bottom: 80,
        x: 2,
        y: 50,
        toJSON: () => { },
      }),
    } as HTMLElement;

    const result = calculateHighlightStyle(mockElement);

    expect(result.left).toBeGreaterThanOrEqual(0);
  });
});

describe('calculateTooltipStyle', () => {
  beforeEach(() => {
    // Mock window dimensions
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
  });

  it('should position tooltip above element by default', () => {
    const mockElement = {
      getBoundingClientRect: () => ({
        top: 200,
        left: 100,
        width: 150,
        height: 50,
        right: 250,
        bottom: 250,
        x: 100,
        y: 200,
        toJSON: () => { },
      }),
    } as HTMLElement;

    const result = calculateTooltipStyle(mockElement);

    // Tooltip should be above the element
    expect(result.top).toBeLessThan(200);
  });

  it('should position tooltip below element when no space above', () => {
    const mockElement = {
      getBoundingClientRect: () => ({
        top: 20,
        left: 100,
        width: 150,
        height: 50,
        right: 250,
        bottom: 70,
        x: 100,
        y: 20,
        toJSON: () => { },
      }),
    } as HTMLElement;

    const result = calculateTooltipStyle(mockElement);

    // Tooltip should be below the element
    expect(result.top).toBeGreaterThan(70);
  });

  it('should keep tooltip within horizontal viewport bounds', () => {
    const mockElement = {
      getBoundingClientRect: () => ({
        top: 200,
        left: 1100,
        width: 100,
        height: 50,
        right: 1200,
        bottom: 250,
        x: 1100,
        y: 200,
        toJSON: () => { },
      }),
    } as HTMLElement;

    const result = calculateTooltipStyle(mockElement);

    // Tooltip should not exceed viewport width
    expect(result.left + 200).toBeLessThanOrEqual(1200);
  });
});

describe('shouldIgnoreElement', () => {
  it('should ignore elements with data-feedback-overlay attribute', () => {
    const element = document.createElement('div');
    element.setAttribute('data-feedback-overlay', 'true');
    element.style.width = '100px';
    element.style.height = '100px';
    document.body.appendChild(element);

    // Mock getBoundingClientRect
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 0, left: 0, width: 100, height: 100,
      right: 100, bottom: 100, x: 0, y: 0, toJSON: () => { },
    });

    expect(shouldIgnoreElement(element)).toBe(true);

    document.body.removeChild(element);
  });

  it('should ignore very small elements', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 0, left: 0, width: 3, height: 3,
      right: 3, bottom: 3, x: 0, y: 0, toJSON: () => { },
    });

    expect(shouldIgnoreElement(element)).toBe(true);

    document.body.removeChild(element);
  });

  it('should not ignore normal elements', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 0, left: 0, width: 100, height: 50,
      right: 100, bottom: 50, x: 0, y: 0, toJSON: () => { },
    });

    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      visibility: 'visible',
      display: 'block',
    } as CSSStyleDeclaration);

    expect(shouldIgnoreElement(element)).toBe(false);

    document.body.removeChild(element);
  });
});
