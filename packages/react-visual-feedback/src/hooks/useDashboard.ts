/**
 * React Visual Feedback - useDashboard Hook
 *
 * Custom hook for managing dashboard visibility state.
 * This hook implements the Interface Segregation Principle by providing
 * a focused API for dashboard visibility control.
 *
 * @packageDocumentation
 */

import { useState, useCallback, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for the useDashboard hook
 */
export interface UseDashboardOptions {
  /**
   * Controlled open state. When provided, the hook operates in controlled mode.
   * @default undefined (uncontrolled mode)
   */
  controlledIsOpen?: boolean;

  /**
   * Callback invoked when open state changes in controlled mode.
   * Required when using controlledIsOpen.
   */
  onOpenChange?: (isOpen: boolean) => void;

  /**
   * Initial open state for uncontrolled mode.
   * @default false
   */
  defaultOpen?: boolean;
}

/**
 * Return type of the useDashboard hook
 */
export interface UseDashboardReturn {
  /** Whether the dashboard is currently open */
  isOpen: boolean;

  /**
   * Set open state. Supports both direct values and updater functions.
   * In controlled mode, this calls onOpenChange.
   * In uncontrolled mode, this updates internal state.
   */
  setIsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;

  /** Open the dashboard */
  open: () => void;

  /** Close the dashboard */
  close: () => void;

  /** Toggle the dashboard open/closed state */
  toggle: () => void;

  /** Whether the hook is operating in controlled mode */
  isControlled: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing dashboard visibility state.
 *
 * Supports both controlled and uncontrolled modes:
 * - Controlled: When `controlledIsOpen` is provided, state is managed externally
 * - Uncontrolled: When `controlledIsOpen` is undefined, state is managed internally
 *
 * @example
 * ```tsx
 * // Uncontrolled usage
 * function MyComponent() {
 *   const { isOpen, open, close } = useDashboard({ defaultOpen: false });
 *   return (
 *     <div>
 *       <button onClick={open}>Open Dashboard</button>
 *       {isOpen && <Dashboard />}
 *     </div>
 *   );
 * }
 *
 * // Controlled usage
 * function MyComponent() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   const dashboard = useDashboard({
 *     controlledIsOpen: isOpen,
 *     onOpenChange: setIsOpen,
 *   });
 *   return <button onClick={dashboard.toggle}>Toggle Dashboard</button>;
 * }
 * ```
 */
export function useDashboard(options: UseDashboardOptions = {}): UseDashboardReturn {
  const {
    controlledIsOpen,
    onOpenChange,
    defaultOpen = false,
  } = options;

  // Internal state for uncontrolled mode
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);

  // Determine if controlled mode
  const isControlled = controlledIsOpen !== undefined;

  // Determine current open state
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  // Set open state (handles both controlled and uncontrolled modes)
  const setIsOpen = useCallback(
    (newValue: boolean | ((prev: boolean) => boolean)) => {
      if (isControlled) {
        // Controlled mode: call external handler
        if (onOpenChange) {
          const value = typeof newValue === 'function'
            ? newValue(controlledIsOpen)
            : newValue;
          onOpenChange(value);
        }
      } else {
        // Uncontrolled mode: update internal state
        setInternalIsOpen(newValue);
      }
    },
    [isControlled, controlledIsOpen, onOpenChange]
  );

  // Convenience methods
  const open = useCallback(() => {
    setIsOpen(true);
  }, [setIsOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, [setIsOpen]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(
    () => ({
      isOpen,
      setIsOpen,
      open,
      close,
      toggle,
      isControlled,
    }),
    [isOpen, setIsOpen, open, close, toggle, isControlled]
  );
}

// Re-export types for convenience
export type { UseDashboardOptions, UseDashboardReturn };
