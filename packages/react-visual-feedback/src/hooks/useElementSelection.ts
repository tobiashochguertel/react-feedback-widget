/**
 * React Visual Feedback - useElementSelection Hook
 *
 * Custom hook for managing element selection via mouse interaction.
 * This hook implements the Interface Segregation Principle by providing
 * a focused API for element selection and highlighting.
 *
 * @packageDocumentation
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * React component information extracted from a DOM element
 */
export interface ComponentInfo {
  /** Component name (from React fiber) */
  name: string;
  /** File path if available */
  filePath?: string;
  /** Line number if available */
  lineNumber?: number;
}

/**
 * Information about a selected or hovered element in the selection hook.
 * This is a simplified version for the selection hook, containing the DOM element and computed info.
 * For the full element metadata type, see {@link ElementInfo} in types/index.ts.
 */
export interface SelectionElementInfo {
  /** The DOM element */
  element: HTMLElement;
  /** React component info if available */
  componentInfo: ComponentInfo | null;
  /** Bounding rect of the element */
  rect: DOMRect;
  /** XPath or selector for the element */
  selector?: string;
}

/**
 * Style object for element highlight overlay positioning.
 * Uses numeric values for direct pixel positioning.
 * For the full CSS style type, see {@link HighlightStyle} in types/index.ts.
 */
export interface SelectionHighlightStyle {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Style object for tooltip positioning in the selection overlay.
 * Uses numeric values for direct pixel positioning.
 * For the full CSS style type, see {@link TooltipStyle} in types/index.ts.
 */
export interface SelectionTooltipStyle {
  left: number;
  top: number;
}

/**
 * Options for the useElementSelection hook
 */
export interface UseElementSelectionOptions {
  /** Whether element selection is enabled */
  enabled?: boolean;

  /** Throttle interval for mouse move events (ms) */
  throttleMs?: number;

  /** Container element to scope selection to (defaults to document.body) */
  containerRef?: React.RefObject<HTMLElement | null>;

  /** Callback when an element is hovered */
  onElementHover?: (info: SelectionElementInfo | null) => void;

  /** Callback when an element is selected (clicked) */
  onElementSelect?: (info: SelectionElementInfo) => void;

  /** Elements to exclude from selection (e.g., feedback UI elements) */
  excludeSelector?: string;
}

/**
 * Return type of the useElementSelection hook
 */
export interface UseElementSelectionReturn {
  /** Whether selection is currently enabled */
  isEnabled: boolean;

  /** Currently hovered element */
  hoveredElement: HTMLElement | null;

  /** Currently selected element */
  selectedElement: HTMLElement | null;

  /** Component info for hovered element */
  hoveredComponentInfo: ComponentInfo | null;

  /** Component info for selected element */
  selectedComponentInfo: ComponentInfo | null;

  /** Element info for hovered element */
  hoveredElementInfo: SelectionElementInfo | null;

  /** Style for highlight overlay */
  highlightStyle: SelectionHighlightStyle | null;

  /** Style for tooltip positioning */
  tooltipStyle: SelectionTooltipStyle | null;

  /** Enable element selection */
  enable: () => void;

  /** Disable element selection */
  disable: () => void;

  /** Toggle element selection */
  toggle: () => void;

  /** Clear the current selection */
  clearSelection: () => void;

  /** Clear hover state */
  clearHover: () => void;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract React component info from a DOM element
 */
function extractComponentInfo(element: HTMLElement): ComponentInfo | null {
  // Look for React fiber keys
  const fiberKey = Object.keys(element).find(
    (key) => key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')
  );

  if (!fiberKey) {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let fiber = (element as any)[fiberKey];

    // Walk up the fiber tree to find a named component
    while (fiber) {
      if (fiber.type && typeof fiber.type === 'function') {
        const name = fiber.type.displayName || fiber.type.name;
        if (name && name !== 'Anonymous') {
          // Try to get source info from _source (development mode only)
          const source = fiber._debugSource;
          return {
            name,
            filePath: source?.fileName,
            lineNumber: source?.lineNumber,
          };
        }
      }
      fiber = fiber.return;
    }
  } catch {
    // Ignore errors accessing React internals
  }

  return null;
}

/**
 * Generate a CSS selector for an element
 */
function generateSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const tagName = element.tagName.toLowerCase();
  const classes = Array.from(element.classList).slice(0, 2).join('.');

  if (classes) {
    return `${tagName}.${classes}`;
  }

  return tagName;
}

/**
 * Create element info object from a DOM element
 */
function createElementInfo(element: HTMLElement): SelectionElementInfo {
  return {
    element,
    componentInfo: extractComponentInfo(element),
    rect: element.getBoundingClientRect(),
    selector: generateSelector(element),
  };
}

/**
 * Check if an element should be excluded from selection
 */
function shouldExcludeElement(element: HTMLElement, excludeSelector?: string): boolean {
  if (!excludeSelector) {
    return false;
  }

  // Check if element or any parent matches the exclude selector
  return element.closest(excludeSelector) !== null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing element selection via mouse interaction.
 *
 * Provides:
 * - Mouse tracking for hover/click detection
 * - Element highlighting styles
 * - Tooltip positioning
 * - React component info extraction
 * - Enable/disable control
 *
 * @example
 * ```tsx
 * function SelectionMode() {
 *   const {
 *     isEnabled,
 *     hoveredElement,
 *     highlightStyle,
 *     tooltipStyle,
 *     enable,
 *     disable,
 *   } = useElementSelection({
 *     onElementSelect: (info) => {
 *       console.log('Selected:', info.element);
 *     },
 *   });
 *
 *   return (
 *     <div>
 *       <button onClick={isEnabled ? disable : enable}>
 *         {isEnabled ? 'Cancel' : 'Select Element'}
 *       </button>
 *       {isEnabled && highlightStyle && (
 *         <div
 *           style={{
 *             position: 'fixed',
 *             ...highlightStyle,
 *             border: '2px solid blue',
 *             pointerEvents: 'none',
 *           }}
 *         />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useElementSelection(
  options: UseElementSelectionOptions = {}
): UseElementSelectionReturn {
  const {
    enabled: initialEnabled = false,
    throttleMs = 16, // ~60fps
    containerRef,
    onElementHover,
    onElementSelect,
    excludeSelector,
  } = options;

  // State
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [hoveredElementInfo, setHoveredElementInfo] = useState<SelectionElementInfo | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<SelectionTooltipStyle | null>(null);

  // Refs for throttling and cleanup
  const lastMoveTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  // Sync enabled state with prop
  useEffect(() => {
    setIsEnabled(initialEnabled);
  }, [initialEnabled]);

  // Calculate highlight style from hovered element
  const highlightStyle = useMemo((): SelectionHighlightStyle | null => {
    if (!hoveredElement) {
      return null;
    }

    const rect = hoveredElement.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }, [hoveredElement]);

  // Get component info for hovered element
  const hoveredComponentInfo = hoveredElementInfo?.componentInfo ?? null;

  // Get component info for selected element
  const selectedComponentInfo = useMemo((): ComponentInfo | null => {
    if (!selectedElement) {
      return null;
    }
    return extractComponentInfo(selectedElement);
  }, [selectedElement]);

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isEnabled) {
        return;
      }

      // Throttle with requestAnimationFrame
      const now = performance.now();
      if (now - lastMoveTimeRef.current < throttleMs) {
        return;
      }
      lastMoveTimeRef.current = now;

      // Cancel any pending RAF
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;

        if (!target || !(target instanceof HTMLElement)) {
          setHoveredElement(null);
          setHoveredElementInfo(null);
          setTooltipPosition(null);
          onElementHover?.(null);
          return;
        }

        // Check if element should be excluded
        if (shouldExcludeElement(target, excludeSelector)) {
          return;
        }

        // Check container scope
        const container = containerRef?.current;
        if (container && !container.contains(target)) {
          return;
        }

        // Update state
        const info = createElementInfo(target);
        setHoveredElement(target);
        setHoveredElementInfo(info);
        setTooltipPosition({
          left: e.clientX + 10,
          top: e.clientY + 10,
        });
        onElementHover?.(info);
      });
    },
    [isEnabled, throttleMs, containerRef, excludeSelector, onElementHover]
  );

  // Handle click
  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (!isEnabled || !hoveredElement) {
        return;
      }

      // Prevent default click behavior
      e.preventDefault();
      e.stopPropagation();

      const info = createElementInfo(hoveredElement);
      setSelectedElement(hoveredElement);
      onElementSelect?.(info);
    },
    [isEnabled, hoveredElement, onElementSelect]
  );

  // Set up event listeners
  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('click', handleClick, { capture: true });

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, { capture: true });

      // Cancel any pending RAF
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isEnabled, handleMouseMove, handleClick]);

  // Clear hover when disabled
  useEffect(() => {
    if (!isEnabled) {
      setHoveredElement(null);
      setHoveredElementInfo(null);
      setTooltipPosition(null);
    }
  }, [isEnabled]);

  // Control methods
  const enable = useCallback(() => {
    setIsEnabled(true);
  }, []);

  const disable = useCallback(() => {
    setIsEnabled(false);
  }, []);

  const toggle = useCallback(() => {
    setIsEnabled((prev) => !prev);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedElement(null);
  }, []);

  const clearHover = useCallback(() => {
    setHoveredElement(null);
    setHoveredElementInfo(null);
    setTooltipPosition(null);
  }, []);

  // Memoize return value
  return useMemo(
    () => ({
      isEnabled,
      hoveredElement,
      selectedElement,
      hoveredComponentInfo,
      selectedComponentInfo,
      hoveredElementInfo,
      highlightStyle,
      tooltipStyle: tooltipPosition,
      enable,
      disable,
      toggle,
      clearSelection,
      clearHover,
    }),
    [
      isEnabled,
      hoveredElement,
      selectedElement,
      hoveredComponentInfo,
      selectedComponentInfo,
      hoveredElementInfo,
      highlightStyle,
      tooltipPosition,
      enable,
      disable,
      toggle,
      clearSelection,
      clearHover,
    ]
  );
}
