/**
 * React Visual Feedback - useActivation Hook
 *
 * Custom hook for managing activation state of the feedback system.
 * This hook implements the Interface Segregation Principle by providing
 * a focused API for activation control.
 *
 * @packageDocumentation
 */

import { useState, useCallback, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for the useActivation hook
 */
export interface UseActivationOptions {
  /**
   * Controlled activation state. When provided, the hook operates in controlled mode.
   * @default undefined (uncontrolled mode)
   */
  controlledIsActive?: boolean;

  /**
   * Callback invoked when activation state changes in controlled mode.
   * Required when using controlledIsActive.
   */
  onActiveChange?: (active: boolean) => void;

  /**
   * Initial activation state for uncontrolled mode.
   * @default false
   */
  defaultOpen?: boolean;
}

/**
 * Return type of the useActivation hook
 */
export interface UseActivationReturn {
  /** Current activation state */
  isActive: boolean;

  /**
   * Set activation state. Supports both direct values and updater functions.
   * In controlled mode, this calls onActiveChange.
   * In uncontrolled mode, this updates internal state.
   */
  setIsActive: (active: boolean | ((prev: boolean) => boolean)) => void;

  /** Toggle activation state */
  toggle: () => void;

  /** Activate the feedback system */
  activate: () => void;

  /** Deactivate the feedback system */
  deactivate: () => void;

  /** Whether the hook is operating in controlled mode */
  isControlled: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing activation state of the feedback system.
 *
 * Supports both controlled and uncontrolled modes:
 * - Controlled: When `controlledIsActive` is provided, state is managed externally
 * - Uncontrolled: When `controlledIsActive` is undefined, state is managed internally
 *
 * @example
 * ```tsx
 * // Uncontrolled usage
 * function MyComponent() {
 *   const { isActive, toggle } = useActivation({ defaultOpen: false });
 *   return <button onClick={toggle}>{isActive ? 'Active' : 'Inactive'}</button>;
 * }
 *
 * // Controlled usage
 * function MyComponent() {
 *   const [isActive, setIsActive] = useState(false);
 *   const activation = useActivation({
 *     controlledIsActive: isActive,
 *     onActiveChange: setIsActive,
 *   });
 *   return <button onClick={activation.toggle}>Toggle</button>;
 * }
 * ```
 */
export function useActivation(options: UseActivationOptions = {}): UseActivationReturn {
  const {
    controlledIsActive,
    onActiveChange,
    defaultOpen = false,
  } = options;

  // Internal state for uncontrolled mode
  const [internalIsActive, setInternalIsActive] = useState(defaultOpen);

  // Determine if controlled mode
  const isControlled = controlledIsActive !== undefined;

  // Determine current activation state
  const isActive = isControlled ? controlledIsActive : internalIsActive;

  // Set activation state (handles both controlled and uncontrolled modes)
  const setIsActive = useCallback(
    (newValue: boolean | ((prev: boolean) => boolean)) => {
      if (isControlled) {
        // Controlled mode: call external handler
        if (onActiveChange) {
          const value = typeof newValue === 'function'
            ? newValue(controlledIsActive)
            : newValue;
          onActiveChange(value);
        }
      } else {
        // Uncontrolled mode: update internal state
        setInternalIsActive(newValue);
      }
    },
    [isControlled, controlledIsActive, onActiveChange]
  );

  // Convenience methods
  const toggle = useCallback(() => {
    setIsActive((prev) => !prev);
  }, [setIsActive]);

  const activate = useCallback(() => {
    setIsActive(true);
  }, [setIsActive]);

  const deactivate = useCallback(() => {
    setIsActive(false);
  }, [setIsActive]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(
    () => ({
      isActive,
      setIsActive,
      toggle,
      activate,
      deactivate,
      isControlled,
    }),
    [isActive, setIsActive, toggle, activate, deactivate, isControlled]
  );
}
