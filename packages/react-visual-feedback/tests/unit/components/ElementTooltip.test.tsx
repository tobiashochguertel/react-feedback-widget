/**
 * ElementTooltip Component Tests
 *
 * Tests for the element tooltip component including:
 * - Rendering and visibility
 * - Element info display (tag, component, id, classes)
 * - Dimensions display
 * - Data attributes display
 * - Variants
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import React from 'react';
import {
  ElementTooltip,
  extractElementInfo,
  type ElementInfo,
  type TooltipVariant,
} from '../../../src/components/Overlay/ElementTooltip';

// ============================================
// MOCKS & FIXTURES
// ============================================

const mockTheme = {
  colors: {
    tooltipBg: 'rgba(17, 24, 39, 0.95)',
    tooltipText: '#ffffff',
  },
};

const defaultStyle = {
  top: 100,
  left: 200,
};

const defaultElementInfo: ElementInfo = {
  tagName: 'button',
  componentName: 'SubmitButton',
  id: 'submit-btn',
  classList: ['btn', 'btn-primary'],
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

describe('ElementTooltip', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('should render when visible is true (default)', () => {
      renderWithTheme(
        <ElementTooltip style={defaultStyle} elementInfo={defaultElementInfo} />
      );

      expect(screen.getByTestId('element-tooltip')).toBeInTheDocument();
    });

    it('should not render when visible is false', () => {
      renderWithTheme(
        <ElementTooltip
          style={defaultStyle}
          elementInfo={defaultElementInfo}
          visible={false}
        />
      );

      expect(screen.queryByTestId('element-tooltip')).not.toBeInTheDocument();
    });

    it('should render with custom testId', () => {
      renderWithTheme(
        <ElementTooltip
          style={defaultStyle}
          elementInfo={defaultElementInfo}
          testId="custom-tooltip"
        />
      );

      expect(screen.getByTestId('custom-tooltip')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      renderWithTheme(
        <ElementTooltip
          style={defaultStyle}
          elementInfo={defaultElementInfo}
          className="custom-class"
        />
      );

      const tooltip = screen.getByTestId('element-tooltip');
      expect(tooltip).toHaveClass('custom-class');
    });

    it('should have data-feedback-overlay attribute', () => {
      renderWithTheme(
        <ElementTooltip style={defaultStyle} elementInfo={defaultElementInfo} />
      );

      const tooltip = screen.getByTestId('element-tooltip');
      expect(tooltip).toHaveAttribute('data-feedback-overlay', 'true');
    });

    it('should have role="tooltip"', () => {
      renderWithTheme(
        <ElementTooltip style={defaultStyle} elementInfo={defaultElementInfo} />
      );

      const tooltip = screen.getByTestId('element-tooltip');
      expect(tooltip).toHaveAttribute('role', 'tooltip');
    });

    it('should render in portal by default', () => {
      renderWithTheme(
        <ElementTooltip style={defaultStyle} elementInfo={defaultElementInfo} />
      );

      const tooltip = screen.getByTestId('element-tooltip');
      expect(tooltip.parentElement).toBe(document.body);
    });

    it('should render without portal when usePortal is false', () => {
      const { container } = renderWithTheme(
        <ElementTooltip
          style={defaultStyle}
          elementInfo={defaultElementInfo}
          usePortal={false}
        />
      );

      const tooltip = screen.getByTestId('element-tooltip');
      expect(container.contains(tooltip)).toBe(true);
    });
  });

  describe('Position', () => {
    it('should apply correct position styles', () => {
      renderWithTheme(
        <ElementTooltip style={defaultStyle} elementInfo={defaultElementInfo} />
      );

      const tooltip = screen.getByTestId('element-tooltip');
      expect(tooltip).toHaveStyle({ top: '100px', left: '200px' });
    });

    it('should apply custom maxWidth', () => {
      renderWithTheme(
        <ElementTooltip
          style={defaultStyle}
          elementInfo={defaultElementInfo}
          maxWidth={400}
        />
      );

      const tooltip = screen.getByTestId('element-tooltip');
      expect(tooltip).toHaveStyle({ maxWidth: '400px' });
    });
  });

  describe('Z-Index', () => {
    it('should use default z-index of 1000000', () => {
      renderWithTheme(
        <ElementTooltip style={defaultStyle} elementInfo={defaultElementInfo} />
      );

      const tooltip = screen.getByTestId('element-tooltip');
      expect(tooltip).toHaveStyle({ zIndex: '1000000' });
    });

    it('should use custom z-index when provided', () => {
      renderWithTheme(
        <ElementTooltip
          style={defaultStyle}
          elementInfo={defaultElementInfo}
          zIndex={500000}
        />
      );

      const tooltip = screen.getByTestId('element-tooltip');
      expect(tooltip).toHaveStyle({ zIndex: '500000' });
    });
  });

  describe('Element Info Display', () => {
    it('should display tag name', () => {
      renderWithTheme(
        <ElementTooltip style={defaultStyle} elementInfo={defaultElementInfo} />
      );

      expect(screen.getByTestId('element-tooltip-tag')).toHaveTextContent('button');
    });

    it('should display component name when provided', () => {
      renderWithTheme(
        <ElementTooltip style={defaultStyle} elementInfo={defaultElementInfo} />
      );

      expect(screen.getByTestId('element-tooltip-component')).toHaveTextContent('SubmitButton');
    });

    it('should not display component name when not provided', () => {
      renderWithTheme(
        <ElementTooltip
          style={defaultStyle}
          elementInfo={{ tagName: 'div' }}
        />
      );

      expect(screen.queryByTestId('element-tooltip-component')).not.toBeInTheDocument();
    });

    it('should display element ID when provided', () => {
      renderWithTheme(
        <ElementTooltip style={defaultStyle} elementInfo={defaultElementInfo} />
      );

      expect(screen.getByTestId('element-tooltip-id')).toHaveTextContent('submit-btn');
    });

    it('should not display ID when not provided', () => {
      renderWithTheme(
        <ElementTooltip
          style={defaultStyle}
          elementInfo={{ tagName: 'div' }}
        />
      );

      expect(screen.queryByTestId('element-tooltip-id')).not.toBeInTheDocument();
    });

    it('should display class list when provided', () => {
      renderWithTheme(
        <ElementTooltip style={defaultStyle} elementInfo={defaultElementInfo} />
      );

      const classLabel = screen.getByTestId('element-tooltip-class');
      expect(classLabel).toHaveTextContent('btn btn-primary');
    });

    it('should not display classes when not provided', () => {
      renderWithTheme(
        <ElementTooltip
          style={defaultStyle}
          elementInfo={{ tagName: 'div' }}
        />
      );

      expect(screen.queryByTestId('element-tooltip-class')).not.toBeInTheDocument();
    });
  });

  describe('Dimensions Display', () => {
    it('should display dimensions when showDimensions is true', () => {
      renderWithTheme(
        <ElementTooltip
          style={defaultStyle}
          elementInfo={{
            ...defaultElementInfo,
            dimensions: { width: 200, height: 50 },
          }}
          showDimensions
        />
      );

      expect(screen.getByTestId('element-tooltip-dimensions')).toHaveTextContent('200 × 50');
    });

    it('should not display dimensions when showDimensions is false', () => {
      renderWithTheme(
        <ElementTooltip
          style={defaultStyle}
          elementInfo={{
            ...defaultElementInfo,
            dimensions: { width: 200, height: 50 },
          }}
          showDimensions={false}
        />
      );

      expect(screen.queryByTestId('element-tooltip-dimensions')).not.toBeInTheDocument();
    });

    it('should not display dimensions by default', () => {
      renderWithTheme(
        <ElementTooltip
          style={defaultStyle}
          elementInfo={{
            ...defaultElementInfo,
            dimensions: { width: 200, height: 50 },
          }}
        />
      );

      expect(screen.queryByTestId('element-tooltip-dimensions')).not.toBeInTheDocument();
    });
  });

  describe('Data Attributes Display', () => {
    it('should display data attributes when showDataAttributes is true', () => {
      renderWithTheme(
        <ElementTooltip
          style={defaultStyle}
          elementInfo={{
            ...defaultElementInfo,
            dataAttributes: { testid: 'btn-submit', action: 'submit' },
          }}
          showDataAttributes
        />
      );

      expect(screen.getByTestId('element-tooltip-data-attrs')).toBeInTheDocument();
    });

    it('should not display data attributes when showDataAttributes is false', () => {
      renderWithTheme(
        <ElementTooltip
          style={defaultStyle}
          elementInfo={{
            ...defaultElementInfo,
            dataAttributes: { testid: 'btn-submit' },
          }}
          showDataAttributes={false}
        />
      );

      expect(screen.queryByTestId('element-tooltip-data-attrs')).not.toBeInTheDocument();
    });

    it('should not display data attributes by default', () => {
      renderWithTheme(
        <ElementTooltip
          style={defaultStyle}
          elementInfo={{
            ...defaultElementInfo,
            dataAttributes: { testid: 'btn-submit' },
          }}
        />
      );

      expect(screen.queryByTestId('element-tooltip-data-attrs')).not.toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    const variants: TooltipVariant[] = [
      'default',
      'dark',
      'light',
      'info',
      'success',
      'warning',
      'error',
    ];

    variants.forEach((variant) => {
      it(`should render with ${variant} variant`, () => {
        renderWithTheme(
          <ElementTooltip
            style={defaultStyle}
            elementInfo={defaultElementInfo}
            variant={variant}
          />
        );

        const tooltip = screen.getByTestId('element-tooltip');
        expect(tooltip).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label describing the element', () => {
      renderWithTheme(
        <ElementTooltip style={defaultStyle} elementInfo={defaultElementInfo} />
      );

      const tooltip = screen.getByTestId('element-tooltip');
      expect(tooltip).toHaveAttribute(
        'aria-label',
        'Element: button (SubmitButton)'
      );
    });

    it('should have aria-label without component name when not provided', () => {
      renderWithTheme(
        <ElementTooltip
          style={defaultStyle}
          elementInfo={{ tagName: 'div' }}
        />
      );

      const tooltip = screen.getByTestId('element-tooltip');
      expect(tooltip).toHaveAttribute('aria-label', 'Element: div');
    });
  });

  describe('Pointer Events', () => {
    it('should have pointer-events: none', () => {
      renderWithTheme(
        <ElementTooltip style={defaultStyle} elementInfo={defaultElementInfo} />
      );

      const tooltip = screen.getByTestId('element-tooltip');
      expect(tooltip).toHaveStyle({ pointerEvents: 'none' });
    });
  });
});

describe('extractElementInfo', () => {
  it('should extract tag name correctly', () => {
    const element = document.createElement('button');
    const info = extractElementInfo(element);

    expect(info.tagName).toBe('button');
  });

  it('should extract element ID when present', () => {
    const element = document.createElement('div');
    element.id = 'test-id';
    const info = extractElementInfo(element);

    expect(info.id).toBe('test-id');
  });

  it('should not include ID when not present', () => {
    const element = document.createElement('div');
    const info = extractElementInfo(element);

    expect(info.id).toBeUndefined();
  });

  it('should extract class list', () => {
    const element = document.createElement('div');
    element.className = 'class-one class-two class-three';
    const info = extractElementInfo(element);

    expect(info.classList).toEqual(['class-one', 'class-two', 'class-three']);
  });

  it('should limit class list to 3 classes', () => {
    const element = document.createElement('div');
    element.className = 'class-1 class-2 class-3 class-4 class-5';
    const info = extractElementInfo(element);

    expect(info.classList?.length).toBe(3);
    expect(info.classList).toEqual(['class-1', 'class-2', 'class-3']);
  });

  it('should not include classList when element has no classes', () => {
    const element = document.createElement('div');
    const info = extractElementInfo(element);

    expect(info.classList).toBeUndefined();
  });

  it('should extract data attributes', () => {
    const element = document.createElement('div');
    element.setAttribute('data-testid', 'test-element');
    element.setAttribute('data-action', 'submit');
    const info = extractElementInfo(element);

    expect(info.dataAttributes).toEqual({
      testid: 'test-element',
      action: 'submit',
    });
  });

  it('should ignore data-feedback attributes', () => {
    const element = document.createElement('div');
    element.setAttribute('data-feedback-overlay', 'true');
    element.setAttribute('data-testid', 'test-element');
    const info = extractElementInfo(element);

    expect(info.dataAttributes).toEqual({ testid: 'test-element' });
  });

  it('should not include dataAttributes when none present', () => {
    const element = document.createElement('div');
    const info = extractElementInfo(element);

    expect(info.dataAttributes).toBeUndefined();
  });
});
