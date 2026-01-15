/**
 * ElementTooltip Component
 *
 * Displays element information in a tooltip during selection mode.
 * Shows tag name, component name, and optionally dimensions.
 *
 * @module components/Overlay/ElementTooltip
 */

import { forwardRef, useMemo } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { createPortal } from 'react-dom';
import type { TooltipStyle } from './SelectionOverlay';

// ============================================
// TYPES
// ============================================

/**
 * Tooltip appearance variants
 */
export type TooltipVariant = 'default' | 'dark' | 'light' | 'info' | 'success' | 'warning' | 'error';

/**
 * Tooltip position relative to element
 */
export type TooltipPosition = 'auto' | 'top' | 'bottom' | 'left' | 'right';

/**
 * Information to display in the tooltip
 */
export interface ElementInfo {
  /** HTML tag name (e.g., 'div', 'button') */
  tagName: string;
  /** React component name if available */
  componentName?: string;
  /** Element ID if present */
  id?: string;
  /** Element class list */
  classList?: string[];
  /** Element dimensions */
  dimensions?: {
    width: number;
    height: number;
  };
  /** Additional data attributes */
  dataAttributes?: Record<string, string>;
}

/**
 * Props for ElementTooltip component
 */
export interface ElementTooltipProps {
  /** Position of the tooltip */
  style: TooltipStyle;
  /** Element information to display */
  elementInfo: ElementInfo;
  /** Tooltip variant/appearance */
  variant?: TooltipVariant;
  /** Whether to show element dimensions */
  showDimensions?: boolean;
  /** Whether to show data attributes */
  showDataAttributes?: boolean;
  /** Maximum width of the tooltip */
  maxWidth?: number;
  /** Z-index for the tooltip */
  zIndex?: number;
  /** Whether the tooltip is visible */
  visible?: boolean;
  /** Whether to render in a portal */
  usePortal?: boolean;
  /** Container element for portal */
  portalContainer?: HTMLElement;
  /** Additional class name */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// ============================================
// ANIMATIONS
// ============================================

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// ============================================
// VARIANT STYLES
// ============================================

const variantStyles = {
  default: css<{ theme?: { colors?: Record<string, string> } }>`
    background: ${props => props.theme?.colors?.tooltipBg || 'rgba(17, 24, 39, 0.95)'};
    color: ${props => props.theme?.colors?.tooltipText || '#ffffff'};
    border: 1px solid rgba(255, 255, 255, 0.1);
  `,
  dark: css`
    background: rgba(0, 0, 0, 0.95);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.1);
  `,
  light: css`
    background: rgba(255, 255, 255, 0.98);
    color: #1f2937;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  `,
  info: css`
    background: rgba(59, 130, 246, 0.95);
    color: #ffffff;
    border: 1px solid rgba(59, 130, 246, 0.3);
  `,
  success: css`
    background: rgba(16, 185, 129, 0.95);
    color: #ffffff;
    border: 1px solid rgba(16, 185, 129, 0.3);
  `,
  warning: css`
    background: rgba(245, 158, 11, 0.95);
    color: #ffffff;
    border: 1px solid rgba(245, 158, 11, 0.3);
  `,
  error: css`
    background: rgba(239, 68, 68, 0.95);
    color: #ffffff;
    border: 1px solid rgba(239, 68, 68, 0.3);
  `,
};

// ============================================
// STYLED COMPONENTS
// ============================================

interface StyledTooltipProps {
  $top: number;
  $left: number;
  $maxWidth: number;
  $zIndex: number;
  $variant: TooltipVariant;
}

const StyledTooltip = styled.div<StyledTooltipProps>`
  position: fixed;
  pointer-events: none;
  box-sizing: border-box;

  /* Position */
  top: ${props => props.$top}px;
  left: ${props => props.$left}px;

  /* Size constraints */
  max-width: ${props => props.$maxWidth}px;
  min-width: 100px;

  /* Styling */
  padding: 8px 12px;
  border-radius: 6px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
  backdrop-filter: blur(8px);

  /* Animation */
  animation: ${fadeInUp} 0.15s ease-out;

  /* Stacking */
  z-index: ${props => props.$zIndex};

  /* Variant styles */
  ${props => variantStyles[props.$variant]}
`;

const TooltipContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TooltipRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TagLabel = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 11px;
  text-transform: lowercase;
  background: rgba(59, 130, 246, 0.3);
  color: #93c5fd;
`;

const ComponentLabel = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 11px;
  background: rgba(168, 85, 247, 0.3);
  color: #d8b4fe;
`;

const IdLabel = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);

  &::before {
    content: '#';
    margin-right: 2px;
    color: rgba(255, 255, 255, 0.5);
  }
`;

const ClassLabel = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &::before {
    content: '.';
    color: rgba(255, 255, 255, 0.4);
  }
`;

const DimensionsLabel = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'SF Mono', Monaco, Consolas, monospace;
`;

const DataAttributeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const DataAttribute = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 9px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  font-family: 'SF Mono', Monaco, Consolas, monospace;
`;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract element information from a DOM element
 */
export function extractElementInfo(element: HTMLElement): ElementInfo {
  const rect = element.getBoundingClientRect();

  // Get data attributes
  const dataAttributes: Record<string, string> = {};
  for (const attr of element.attributes) {
    if (attr.name.startsWith('data-') && !attr.name.includes('feedback')) {
      dataAttributes[attr.name.replace('data-', '')] = attr.value;
    }
  }

  return {
    tagName: element.tagName.toLowerCase(),
    id: element.id || undefined,
    classList: element.classList.length > 0
      ? Array.from(element.classList).slice(0, 3) // Limit to 3 classes
      : undefined,
    dimensions: {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
    dataAttributes: Object.keys(dataAttributes).length > 0
      ? dataAttributes
      : undefined,
  };
}

/**
 * Format dimensions for display
 */
function formatDimensions(dimensions: { width: number; height: number }): string {
  return `${dimensions.width} × ${dimensions.height}`;
}

// ============================================
// COMPONENT
// ============================================

/**
 * ElementTooltip displays information about a DOM element.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ElementTooltip
 *   style={{ top: 100, left: 200 }}
 *   elementInfo={{
 *     tagName: 'button',
 *     componentName: 'SubmitButton',
 *     id: 'submit-btn'
 *   }}
 * />
 *
 * // With dimensions
 * <ElementTooltip
 *   style={tooltipStyle}
 *   elementInfo={elementInfo}
 *   showDimensions
 * />
 *
 * // Dark variant
 * <ElementTooltip
 *   style={tooltipStyle}
 *   elementInfo={elementInfo}
 *   variant="dark"
 * />
 * ```
 */
export const ElementTooltip = forwardRef<HTMLDivElement, ElementTooltipProps>(
  function ElementTooltip(
    {
      style,
      elementInfo,
      variant = 'default',
      showDimensions = false,
      showDataAttributes = false,
      maxWidth = 280,
      zIndex = 1000000,
      visible = true,
      usePortal = true,
      portalContainer,
      className,
      testId = 'element-tooltip',
    },
    ref
  ) {
    // Memoize formatted class list
    const formattedClasses = useMemo(() => {
      if (!elementInfo.classList || elementInfo.classList.length === 0) {
        return null;
      }
      return elementInfo.classList.join(' ');
    }, [elementInfo.classList]);

    // Memoize data attributes
    const dataAttributeEntries = useMemo(() => {
      if (!showDataAttributes || !elementInfo.dataAttributes) {
        return null;
      }
      return Object.entries(elementInfo.dataAttributes).slice(0, 5);
    }, [showDataAttributes, elementInfo.dataAttributes]);

    // Don't render if not visible
    if (!visible) return null;

    const tooltipContent = (
      <StyledTooltip
        ref={ref}
        $top={style.top}
        $left={style.left}
        $maxWidth={maxWidth}
        $zIndex={zIndex}
        $variant={variant}
        className={className}
        data-testid={testId}
        data-feedback-overlay="true"
        role="tooltip"
        aria-label={`Element: ${elementInfo.tagName}${elementInfo.componentName ? ` (${elementInfo.componentName})` : ''}`}
      >
        <TooltipContent>
          {/* Main row: tag name and component name */}
          <TooltipRow>
            <TagLabel data-testid={`${testId}-tag`}>
              {elementInfo.tagName}
            </TagLabel>
            {elementInfo.componentName && (
              <ComponentLabel data-testid={`${testId}-component`}>
                {elementInfo.componentName}
              </ComponentLabel>
            )}
          </TooltipRow>

          {/* Secondary row: ID and classes */}
          {(elementInfo.id || formattedClasses) && (
            <TooltipRow>
              {elementInfo.id && (
                <IdLabel data-testid={`${testId}-id`}>
                  {elementInfo.id}
                </IdLabel>
              )}
              {formattedClasses && (
                <ClassLabel
                  data-testid={`${testId}-class`}
                  title={formattedClasses}
                >
                  {formattedClasses}
                </ClassLabel>
              )}
            </TooltipRow>
          )}

          {/* Dimensions row */}
          {showDimensions && elementInfo.dimensions && (
            <TooltipRow>
              <DimensionsLabel data-testid={`${testId}-dimensions`}>
                {formatDimensions(elementInfo.dimensions)}
              </DimensionsLabel>
            </TooltipRow>
          )}

          {/* Data attributes */}
          {dataAttributeEntries && dataAttributeEntries.length > 0 && (
            <DataAttributeRow data-testid={`${testId}-data-attrs`}>
              {dataAttributeEntries.map(([key, value]) => (
                <DataAttribute key={key} title={`data-${key}="${value}"`}>
                  {key}={value.length > 10 ? `${value.slice(0, 10)}…` : value}
                </DataAttribute>
              ))}
            </DataAttributeRow>
          )}
        </TooltipContent>
      </StyledTooltip>
    );

    if (usePortal) {
      return createPortal(
        tooltipContent,
        portalContainer || document.body
      );
    }

    return tooltipContent;
  }
);

export default ElementTooltip;
