/**
 * ElementHighlight Component
 *
 * Renders a highlight box around a selected or hovered element.
 * Provides visual feedback during element selection mode.
 *
 * @module components/Overlay/ElementHighlight
 */

import { forwardRef, useMemo } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { createPortal } from 'react-dom';
import type { OverlayHighlightStyle } from './SelectionOverlay';

// ============================================
// TYPES
// ============================================

/**
 * Highlight appearance variants
 */
export type HighlightVariant = 'hover' | 'selected' | 'error' | 'success';

/**
 * Animation types for the highlight
 */
export type HighlightAnimation = 'none' | 'pulse' | 'glow' | 'bounce';

/**
 * Props for ElementHighlight component
 */
export interface ElementHighlightProps {
  /** Position and dimensions of the highlight */
  style: OverlayHighlightStyle;
  /** Variant/appearance of the highlight */
  variant?: HighlightVariant;
  /** Animation type */
  animation?: HighlightAnimation;
  /** Border width in pixels */
  borderWidth?: number;
  /** Border radius in pixels */
  borderRadius?: number;
  /** Z-index for the highlight */
  zIndex?: number;
  /** Whether the highlight is visible */
  visible?: boolean;
  /** Whether to render in a portal */
  usePortal?: boolean;
  /** Container element for portal */
  portalContainer?: HTMLElement;
  /** Custom border color (overrides variant) */
  borderColor?: string;
  /** Custom background color (overrides variant) */
  backgroundColor?: string;
  /** Additional class name */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Accessibility label */
  ariaLabel?: string;
}

// ============================================
// ANIMATIONS
// ============================================

const pulseAnimation = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.02);
  }
`;

const glowAnimation = keyframes`
  0%, 100% {
    box-shadow: 0 0 8px 2px rgba(59, 130, 246, 0.5);
  }
  50% {
    box-shadow: 0 0 16px 4px rgba(59, 130, 246, 0.8);
  }
`;

const bounceAnimation = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-2px);
  }
  75% {
    transform: translateY(2px);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

// ============================================
// VARIANT STYLES
// ============================================

const variantStyles = {
  hover: css<{ theme?: { colors?: Record<string, string> } }>`
    border-color: ${props => props.theme?.colors?.highlightBorder || '#3b82f6'};
    background: ${props => props.theme?.colors?.highlightBg || 'rgba(59, 130, 246, 0.1)'};
    box-shadow: 0 0 8px 2px rgba(59, 130, 246, 0.3);
  `,
  selected: css`
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.1);
    box-shadow: 0 0 8px 2px rgba(16, 185, 129, 0.3);
  `,
  error: css`
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
    box-shadow: 0 0 8px 2px rgba(239, 68, 68, 0.3);
  `,
  success: css`
    border-color: #22c55e;
    background: rgba(34, 197, 94, 0.1);
    box-shadow: 0 0 8px 2px rgba(34, 197, 94, 0.3);
  `,
};

const animationStyles = {
  none: css``,
  pulse: css`
    animation: ${pulseAnimation} 1.5s ease-in-out infinite;
  `,
  glow: css`
    animation: ${glowAnimation} 1.5s ease-in-out infinite;
  `,
  bounce: css`
    animation: ${bounceAnimation} 0.6s ease-in-out infinite;
  `,
};

// ============================================
// STYLED COMPONENTS
// ============================================

interface StyledHighlightProps {
  $top: number;
  $left: number;
  $width: number;
  $height: number;
  $borderWidth: number;
  $borderRadius: number;
  $zIndex: number;
  $variant: HighlightVariant;
  $animation: HighlightAnimation;
  $customBorderColor?: string;
  $customBackgroundColor?: string;
}

const StyledHighlight = styled.div<StyledHighlightProps>`
  position: fixed;
  pointer-events: none;
  box-sizing: border-box;
  transition: all 0.15s ease-out;
  animation: ${fadeIn} 0.15s ease-out;

  /* Position and size */
  top: ${props => props.$top}px;
  left: ${props => props.$left}px;
  width: ${props => props.$width}px;
  height: ${props => props.$height}px;

  /* Border */
  border-style: solid;
  border-width: ${props => props.$borderWidth}px;
  border-radius: ${props => props.$borderRadius}px;

  /* Stacking */
  z-index: ${props => props.$zIndex};

  /* Variant styles */
  ${props => variantStyles[props.$variant]}

  /* Animation */
  ${props => animationStyles[props.$animation]}

  /* Custom overrides */
  ${props => props.$customBorderColor && css`
    border-color: ${props.$customBorderColor};
  `}

  ${props => props.$customBackgroundColor && css`
    background: ${props.$customBackgroundColor};
  `}
`;

// Corner markers for enhanced visibility
const CornerMarker = styled.div<{
  $position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  $color: string;
}>`
  position: absolute;
  width: 8px;
  height: 8px;
  border-width: 2px;
  border-style: solid;
  border-color: ${props => props.$color};

  ${props => {
    switch (props.$position) {
      case 'top-left':
        return css`
          top: -2px;
          left: -2px;
          border-right: none;
          border-bottom: none;
          border-top-left-radius: 4px;
        `;
      case 'top-right':
        return css`
          top: -2px;
          right: -2px;
          border-left: none;
          border-bottom: none;
          border-top-right-radius: 4px;
        `;
      case 'bottom-left':
        return css`
          bottom: -2px;
          left: -2px;
          border-right: none;
          border-top: none;
          border-bottom-left-radius: 4px;
        `;
      case 'bottom-right':
        return css`
          bottom: -2px;
          right: -2px;
          border-left: none;
          border-top: none;
          border-bottom-right-radius: 4px;
        `;
    }
  }}
`;

// ============================================
// COMPONENT
// ============================================

/**
 * ElementHighlight renders a visual highlight around a DOM element.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ElementHighlight
 *   style={{ top: 100, left: 200, width: 150, height: 50 }}
 *   variant="hover"
 * />
 *
 * // With animation
 * <ElementHighlight
 *   style={highlightStyle}
 *   variant="selected"
 *   animation="pulse"
 * />
 *
 * // Custom colors
 * <ElementHighlight
 *   style={highlightStyle}
 *   borderColor="#ff6b6b"
 *   backgroundColor="rgba(255, 107, 107, 0.1)"
 * />
 * ```
 */
export const ElementHighlight = forwardRef<HTMLDivElement, ElementHighlightProps>(
  function ElementHighlight(
    {
      style,
      variant = 'hover',
      animation = 'none',
      borderWidth = 2,
      borderRadius = 4,
      zIndex = 999999,
      visible = true,
      usePortal = true,
      portalContainer,
      borderColor,
      backgroundColor,
      className,
      testId = 'element-highlight',
      ariaLabel,
    },
    ref
  ) {
    // Memoize variant color for corner markers
    const markerColor = useMemo(() => {
      if (borderColor) return borderColor;
      switch (variant) {
        case 'selected':
          return '#10b981';
        case 'error':
          return '#ef4444';
        case 'success':
          return '#22c55e';
        default:
          return '#3b82f6';
      }
    }, [variant, borderColor]);

    // Don't render if not visible
    if (!visible) return null;

    const highlightContent = (
      <StyledHighlight
        ref={ref}
        $top={style.top}
        $left={style.left}
        $width={style.width}
        $height={style.height}
        $borderWidth={borderWidth}
        $borderRadius={borderRadius}
        $zIndex={zIndex}
        $variant={variant}
        $animation={animation}
        $customBorderColor={borderColor}
        $customBackgroundColor={backgroundColor}
        className={className}
        data-testid={testId}
        data-feedback-overlay="true"
        role="presentation"
        aria-label={ariaLabel || `Highlighted element at position ${style.left}, ${style.top}`}
      >
        {/* Corner markers for enhanced visibility */}
        <CornerMarker $position="top-left" $color={markerColor} />
        <CornerMarker $position="top-right" $color={markerColor} />
        <CornerMarker $position="bottom-left" $color={markerColor} />
        <CornerMarker $position="bottom-right" $color={markerColor} />
      </StyledHighlight>
    );

    if (usePortal) {
      return createPortal(
        highlightContent,
        portalContainer || document.body
      );
    }

    return highlightContent;
  }
);

export default ElementHighlight;
