/**
 * SelectionOverlay Component
 *
 * A full-screen overlay that appears during element selection mode.
 * Provides a semi-transparent backdrop with crosshair cursor to indicate
 * that the user is in feedback selection mode.
 *
 * @module components/Overlay/SelectionOverlay
 */

import { forwardRef, useCallback, useEffect, useRef } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { createPortal } from 'react-dom';

// ============================================
// TYPES
// ============================================

/**
 * Position in the viewport
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Style properties for the highlight box in selection mode.
 * Uses numeric pixel values for positioning.
 */
export interface OverlayHighlightStyle {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Style properties for the tooltip in selection mode.
 * Uses numeric pixel values for positioning.
 */
export interface OverlayTooltipStyle {
  top: number;
  left: number;
}

/**
 * Information about a hovered element in the selection overlay
 */
export interface HoveredElementInfo {
  element: HTMLElement;
  highlightStyle: OverlayHighlightStyle;
  tooltipStyle: OverlayTooltipStyle;
  componentInfo?: {
    componentName: string;
    props?: Record<string, unknown>;
  } | null;
}

/**
 * Props for SelectionOverlay component
 */
export interface SelectionOverlayProps {
  /** Whether the selection overlay is visible */
  isActive: boolean;
  /** Callback when an element is clicked/selected */
  onElementSelect?: (element: HTMLElement) => void;
  /** Callback when mouse moves over elements */
  onElementHover?: (info: HoveredElementInfo | null) => void;
  /** Callback when escape key is pressed */
  onCancel?: () => void;
  /** Z-index for the overlay (default: 999998) */
  zIndex?: number;
  /** Background color/opacity override */
  backgroundColor?: string;
  /** Cursor style (default: crosshair) */
  cursor?: string;
  /** Whether to render in a portal (default: true) */
  usePortal?: boolean;
  /** Container element for portal (default: document.body) */
  portalContainer?: HTMLElement;
  /** Additional class name */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// ============================================
// ANIMATIONS
// ============================================

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

// ============================================
// STYLED COMPONENTS
// ============================================

interface StyledOverlayProps {
  $zIndex: number;
  $backgroundColor?: string;
  $cursor: string;
  $isExiting?: boolean;
}

const StyledOverlay = styled.div<StyledOverlayProps>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: ${props => props.$zIndex};
  pointer-events: none;
  transition: background 0.2s ease;
  animation: ${props => props.$isExiting ? fadeOut : fadeIn} 0.2s ease forwards;

  ${props => css`
    background: ${props.$backgroundColor || props.theme?.colors?.overlayBg || 'rgba(0, 0, 0, 0.1)'};
    cursor: ${props.$cursor};
  `}
`;

const InteractiveLayer = styled.div<{ $zIndex: number }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: ${props => props.$zIndex};
  cursor: crosshair;
  pointer-events: auto;
`;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate highlight box position and dimensions for an element
 */
export function calculateHighlightStyle(element: HTMLElement): OverlayHighlightStyle {
  const rect = element.getBoundingClientRect();
  const padding = 4; // Small padding around the element

  return {
    top: Math.max(0, rect.top - padding),
    left: Math.max(0, rect.left - padding),
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

/**
 * Calculate tooltip position based on element position
 * Positions tooltip above the element, or below if not enough space
 */
export function calculateTooltipStyle(
  element: HTMLElement,
  tooltipHeight: number = 36,
  tooltipOffset: number = 8
): OverlayTooltipStyle {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  // Default: position above the element
  let top = rect.top - tooltipHeight - tooltipOffset;
  let left = rect.left;

  // If not enough space above, position below
  if (top < tooltipOffset) {
    top = rect.bottom + tooltipOffset;
  }

  // Keep tooltip within viewport horizontally
  if (left < tooltipOffset) {
    left = tooltipOffset;
  } else if (left + 200 > viewportWidth) {
    // Approximate tooltip width
    left = viewportWidth - 200 - tooltipOffset;
  }

  // Keep tooltip within viewport vertically
  if (top + tooltipHeight > viewportHeight - tooltipOffset) {
    top = viewportHeight - tooltipHeight - tooltipOffset;
  }

  return { top, left };
}

/**
 * Get React component information from an element's React fiber
 */
export function getComponentInfo(element: HTMLElement): HoveredElementInfo['componentInfo'] | null {
  // Try to get React fiber from element
  const fiberKey = Object.keys(element).find(
    key => key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')
  );

  if (!fiberKey) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let fiber = (element as any)[fiberKey];
    let depth = 0;
    const maxDepth = 20;

    // Walk up the fiber tree to find a named component
    while (fiber && depth < maxDepth) {
      if (fiber.type && typeof fiber.type === 'function') {
        const name = fiber.type.displayName || fiber.type.name;
        if (name && !name.startsWith('Styled') && name !== 'Fragment') {
          return {
            componentName: name,
            props: fiber.memoizedProps || undefined,
          };
        }
      }
      fiber = fiber.return;
      depth++;
    }
  } catch {
    // Ignore errors when accessing React internals
  }

  return null;
}

/**
 * Check if an element should be ignored during selection
 */
export function shouldIgnoreElement(element: HTMLElement): boolean {
  // Ignore elements that are part of the overlay itself
  if (element.closest('[data-feedback-overlay]')) {
    return true;
  }

  // Ignore very small elements
  const rect = element.getBoundingClientRect();
  if (rect.width < 5 || rect.height < 5) {
    return true;
  }

  // Ignore invisible elements
  const style = window.getComputedStyle(element);
  if (style.visibility === 'hidden' || style.display === 'none') {
    return true;
  }

  return false;
}

// ============================================
// COMPONENT
// ============================================

/**
 * SelectionOverlay provides a full-screen overlay for element selection mode.
 *
 * @example
 * ```tsx
 * <SelectionOverlay
 *   isActive={isSelecting}
 *   onElementSelect={handleSelect}
 *   onElementHover={handleHover}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export const SelectionOverlay = forwardRef<HTMLDivElement, SelectionOverlayProps>(
  function SelectionOverlay(
    {
      isActive,
      onElementSelect,
      onElementHover,
      onCancel,
      zIndex = 999998,
      backgroundColor,
      cursor = 'crosshair',
      usePortal = true,
      portalContainer,
      className,
      testId = 'selection-overlay',
    },
    ref
  ) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const isExiting = useRef(false);

    // Handle escape key to cancel selection
    useEffect(() => {
      if (!isActive) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel?.();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isActive, onCancel]);

    // Handle mouse move to track hovered element
    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        // Get element under cursor (excluding overlay)
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const targetElement = elements.find(
          el => !el.closest('[data-feedback-overlay]') && el instanceof HTMLElement
        ) as HTMLElement | undefined;

        if (!targetElement || shouldIgnoreElement(targetElement)) {
          onElementHover?.(null);
          return;
        }

        const highlightStyle = calculateHighlightStyle(targetElement);
        const tooltipStyle = calculateTooltipStyle(targetElement);
        const componentInfo = getComponentInfo(targetElement);

        onElementHover?.({
          element: targetElement,
          highlightStyle,
          tooltipStyle,
          componentInfo,
        });
      },
      [onElementHover]
    );

    // Handle click to select element
    const handleClick = useCallback(
      (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const targetElement = elements.find(
          el => !el.closest('[data-feedback-overlay]') && el instanceof HTMLElement
        ) as HTMLElement | undefined;

        if (targetElement && !shouldIgnoreElement(targetElement)) {
          onElementSelect?.(targetElement);
        }
      },
      [onElementSelect]
    );

    // Set up mouse event listeners
    useEffect(() => {
      if (!isActive) return;

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('click', handleClick, true);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('click', handleClick, true);
      };
    }, [isActive, handleMouseMove, handleClick]);

    // Don't render if not active
    if (!isActive) return null;

    const overlayContent = (
      <>
        <StyledOverlay
          ref={node => {
            // Handle both refs
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (overlayRef as any).current = node;
          }}
          $zIndex={zIndex}
          $backgroundColor={backgroundColor}
          $cursor={cursor}
          $isExiting={isExiting.current}
          className={className}
          data-testid={testId}
          data-feedback-overlay="true"
        />
        <InteractiveLayer
          $zIndex={zIndex + 1}
          data-feedback-overlay="true"
        />
      </>
    );

    if (usePortal) {
      return createPortal(
        overlayContent,
        portalContainer || document.body
      );
    }

    return overlayContent;
  }
);

export default SelectionOverlay;
