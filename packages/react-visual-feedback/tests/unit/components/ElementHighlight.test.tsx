/**
 * ElementHighlight Component Tests
 *
 * Tests for the element highlight component including:
 * - Rendering and visibility
 * - Position and size styling
 * - Variant styling
 * - Animation support
 * - Corner markers
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import React from 'react';
import {
  ElementHighlight,
  type HighlightVariant,
  type HighlightAnimation,
} from '../../../src/components/Overlay/ElementHighlight';

// ============================================
// MOCKS & FIXTURES
// ============================================

const mockTheme = {
  colors: {
    highlightBorder: '#3b82f6',
    highlightBg: 'rgba(59, 130, 246, 0.1)',
  },
};

const defaultStyle = {
  top: 100,
  left: 200,
  width: 150,
  height: 50,
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

describe('ElementHighlight', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('should render when visible is true (default)', () => {
      renderWithTheme(
        <ElementHighlight style={defaultStyle} />
      );

      expect(screen.getByTestId('element-highlight')).toBeInTheDocument();
    });

    it('should not render when visible is false', () => {
      renderWithTheme(
        <ElementHighlight style={defaultStyle} visible={false} />
      );

      expect(screen.queryByTestId('element-highlight')).not.toBeInTheDocument();
    });

    it('should render with custom testId', () => {
      renderWithTheme(
        <ElementHighlight style={defaultStyle} testId="custom-highlight" />
      );

      expect(screen.getByTestId('custom-highlight')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      renderWithTheme(
        <ElementHighlight style={defaultStyle} className="custom-class" />
      );

      const highlight = screen.getByTestId('element-highlight');
      expect(highlight).toHaveClass('custom-class');
    });

    it('should have data-feedback-overlay attribute', () => {
      renderWithTheme(
        <ElementHighlight style={defaultStyle} />
      );

      const highlight = screen.getByTestId('element-highlight');
      expect(highlight).toHaveAttribute('data-feedback-overlay', 'true');
    });

    it('should have role="presentation"', () => {
      renderWithTheme(
        <ElementHighlight style={defaultStyle} />
      );

      const highlight = screen.getByTestId('element-highlight');
      expect(highlight).toHaveAttribute('role', 'presentation');
    });

    it('should render in portal by default', () => {
      renderWithTheme(
        <ElementHighlight style={defaultStyle} />
      );

      const highlight = screen.getByTestId('element-highlight');
      expect(highlight.parentElement).toBe(document.body);
    });

    it('should render without portal when usePortal is false', () => {
      const { container } = renderWithTheme(
        <ElementHighlight style={defaultStyle} usePortal={false} />
      );

      const highlight = screen.getByTestId('element-highlight');
      expect(container.contains(highlight)).toBe(true);
    });
  });

  describe('Position and Size', () => {
    it('should apply correct position styles', () => {
      renderWithTheme(
        <ElementHighlight style={defaultStyle} />
      );

      const highlight = screen.getByTestId('element-highlight');
      expect(highlight).toHaveStyle({ top: '100px', left: '200px' });
    });

    it('should apply correct size styles', () => {
      renderWithTheme(
        <ElementHighlight style={defaultStyle} />
      );

      const highlight = screen.getByTestId('element-highlight');
      expect(highlight).toHaveStyle({ width: '150px', height: '50px' });
    });

    it('should apply custom border width', () => {
      renderWithTheme(
        <ElementHighlight style={defaultStyle} borderWidth={4} />
      );

      const highlight = screen.getByTestId('element-highlight');
      expect(highlight).toHaveStyle({ borderWidth: '4px' });
    });

    it('should apply custom border radius', () => {
      renderWithTheme(
        <ElementHighlight style={defaultStyle} borderRadius={8} />
      );

      const highlight = screen.getByTestId('element-highlight');
      expect(highlight).toHaveStyle({ borderRadius: '8px' });
    });
  });

  describe('Z-Index', () => {
    it('should use default z-index of 999999', () => {
      renderWithTheme(
        <ElementHighlight style={defaultStyle} />
      );

      const highlight = screen.getByTestId('element-highlight');
      expect(highlight).toHaveStyle({ zIndex: '999999' });
    });

    it('should use custom z-index when provided', () => {
      renderWithTheme(
        <ElementHighlight style={defaultStyle} zIndex={500000} />
      );

      const highlight = screen.getByTestId('element-highlight');
      expect(highlight).toHaveStyle({ zIndex: '500000' });
    });
  });

  describe('Variants', () => {
    const variants: HighlightVariant[] = ['hover', 'selected', 'error', 'success'];

    variants.forEach((variant) => {
      it(`should render with ${variant} variant`, () => {
        renderWithTheme(
          <ElementHighlight style={defaultStyle} variant={variant} />
        );

        const highlight = screen.getByTestId('element-highlight');
        expect(highlight).toBeInTheDocument();
      });
    });

    it('should use hover as default variant', () => {
      renderWithTheme(
        <ElementHighlight style={defaultStyle} />
      );

      const highlight = screen.getByTestId('element-highlight');
      expect(highlight).toBeInTheDocument();
    });
  });

  describe('Custom Colors', () => {
    it('should apply custom border color', () => {
      renderWithTheme(
        <ElementHighlight
          style={defaultStyle}
          borderColor="#ff6b6b"
        />
      );

      const highlight = screen.getByTestId('element-highlight');
      expect(highlight).toHaveStyle({ borderColor: '#ff6b6b' });
    });

    it('should apply custom background color', () => {
      renderWithTheme(
        <ElementHighlight
          style={defaultStyle}
          backgroundColor="rgba(255, 107, 107, 0.1)"
        />
      );

      const highlight = screen.getByTestId('element-highlight');
      expect(highlight).toHaveStyle({ background: 'rgba(255, 107, 107, 0.1)' });
    });
  });

  describe('Animations', () => {
    const animations: HighlightAnimation[] = ['none', 'pulse', 'glow', 'bounce'];

    animations.forEach((animation) => {
      it(`should render with ${animation} animation`, () => {
        renderWithTheme(
          <ElementHighlight style={defaultStyle} animation={animation} />
        );

        const highlight = screen.getByTestId('element-highlight');
        expect(highlight).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have default aria-label', () => {
      renderWithTheme(
        <ElementHighlight style={defaultStyle} />
      );

      const highlight = screen.getByTestId('element-highlight');
      expect(highlight).toHaveAttribute(
        'aria-label',
        'Highlighted element at position 200, 100'
      );
    });

    it('should use custom aria-label when provided', () => {
      renderWithTheme(
        <ElementHighlight
          style={defaultStyle}
          ariaLabel="Selected button element"
        />
      );

      const highlight = screen.getByTestId('element-highlight');
      expect(highlight).toHaveAttribute('aria-label', 'Selected button element');
    });
  });

  describe('Corner Markers', () => {
    it('should render four corner markers', () => {
      renderWithTheme(
        <ElementHighlight style={defaultStyle} usePortal={false} />
      );

      const highlight = screen.getByTestId('element-highlight');
      const markers = highlight.querySelectorAll('div');

      // Should have 4 corner markers
      expect(markers.length).toBe(4);
    });
  });

  describe('Pointer Events', () => {
    it('should have pointer-events: none', () => {
      renderWithTheme(
        <ElementHighlight style={defaultStyle} />
      );

      const highlight = screen.getByTestId('element-highlight');
      expect(highlight).toHaveStyle({ pointerEvents: 'none' });
    });
  });
});
