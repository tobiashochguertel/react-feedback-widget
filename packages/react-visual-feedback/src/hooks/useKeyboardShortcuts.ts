/**
 * React Visual Feedback - useKeyboardShortcuts Hook
 *
 * Custom hook for managing keyboard shortcuts with configurable key bindings.
 * This hook implements the Interface Segregation Principle by providing
 * a focused API for keyboard interaction.
 *
 * @packageDocumentation
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Modifier keys that can be combined with regular keys
 */
export type ModifierKey = 'ctrl' | 'shift' | 'alt' | 'meta';

/**
 * Definition of a keyboard shortcut
 */
export interface KeyboardShortcut {
  /** Unique identifier for the shortcut */
  id: string;

  /** The key to listen for (e.g., 'Escape', 'Enter', 'a', 'F1') */
  key: string;

  /** Modifier keys that must be held (optional) */
  modifiers?: ModifierKey[];

  /** Action to execute when shortcut is triggered */
  action: () => void;

  /** Whether this shortcut is enabled (defaults to true) */
  enabled?: boolean;

  /** Description of what the shortcut does (for help UI) */
  description?: string;
}

/**
 * Options for the useKeyboardShortcuts hook
 */
export interface UseKeyboardShortcutsOptions {
  /** Initial shortcut definitions */
  shortcuts?: KeyboardShortcut[];

  /** Whether keyboard handling is enabled globally */
  enabled?: boolean;

  /** Callback when any shortcut is triggered */
  onShortcutTriggered?: (shortcutId: string) => void;

  /** Whether to prevent default browser behavior for matched shortcuts */
  preventDefault?: boolean;

  /** Whether to stop propagation for matched shortcuts */
  stopPropagation?: boolean;

  /** Element to attach listeners to (defaults to document) */
  targetRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Return type of the useKeyboardShortcuts hook
 */
export interface UseKeyboardShortcutsReturn {
  /** Whether keyboard handling is currently enabled */
  isEnabled: boolean;

  /** List of registered shortcuts */
  shortcuts: KeyboardShortcut[];

  /** Enable keyboard handling */
  enable: () => void;

  /** Disable keyboard handling */
  disable: () => void;

  /** Toggle keyboard handling */
  toggle: () => void;

  /** Register a new shortcut */
  registerShortcut: (shortcut: KeyboardShortcut) => void;

  /** Unregister a shortcut by ID */
  unregisterShortcut: (id: string) => void;

  /** Update an existing shortcut */
  updateShortcut: (id: string, updates: Partial<Omit<KeyboardShortcut, 'id'>>) => void;

  /** Enable a specific shortcut by ID */
  enableShortcut: (id: string) => void;

  /** Disable a specific shortcut by ID */
  disableShortcut: (id: string) => void;

  /** Get a shortcut by ID */
  getShortcut: (id: string) => KeyboardShortcut | undefined;

  /** Check if a shortcut is registered */
  hasShortcut: (id: string) => boolean;

  /** Clear all shortcuts */
  clearShortcuts: () => void;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a keyboard event matches a shortcut definition
 */
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  // Check main key (case-insensitive for letters)
  const eventKey = event.key.toLowerCase();
  const shortcutKey = shortcut.key.toLowerCase();

  if (eventKey !== shortcutKey) {
    return false;
  }

  // Check modifiers
  const modifiers = shortcut.modifiers || [];

  const ctrlRequired = modifiers.includes('ctrl');
  const shiftRequired = modifiers.includes('shift');
  const altRequired = modifiers.includes('alt');
  const metaRequired = modifiers.includes('meta');

  // Check that required modifiers are pressed
  if (ctrlRequired !== (event.ctrlKey || event.metaKey && navigator.platform.includes('Mac'))) {
    // On Mac, Ctrl shortcuts often use Cmd (meta), so we accept either
    if (!ctrlRequired || !event.metaKey) {
      return false;
    }
  }

  if (shiftRequired !== event.shiftKey) {
    return false;
  }

  if (altRequired !== event.altKey) {
    return false;
  }

  if (metaRequired !== event.metaKey) {
    return false;
  }

  // Check for extra modifiers that weren't specified
  if (!ctrlRequired && event.ctrlKey && !event.metaKey) {
    return false;
  }

  if (!altRequired && event.altKey) {
    return false;
  }

  if (!metaRequired && event.metaKey && !ctrlRequired) {
    return false;
  }

  return true;
}

/**
 * Format a shortcut for display (e.g., "Ctrl+S", "⌘+Enter")
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
  const parts: string[] = [];

  if (shortcut.modifiers?.includes('ctrl')) {
    parts.push(isMac ? '⌃' : 'Ctrl');
  }
  if (shortcut.modifiers?.includes('alt')) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (shortcut.modifiers?.includes('shift')) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (shortcut.modifiers?.includes('meta')) {
    parts.push(isMac ? '⌘' : 'Win');
  }

  // Capitalize single letter keys
  const key = shortcut.key.length === 1
    ? shortcut.key.toUpperCase()
    : shortcut.key;

  parts.push(key);

  return parts.join(isMac ? '' : '+');
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing keyboard shortcuts.
 *
 * Provides:
 * - Configurable keyboard shortcuts with modifiers
 * - Dynamic registration/unregistration
 * - Enable/disable control
 * - Shortcut formatting for display
 *
 * @example
 * ```tsx
 * function FeedbackMode() {
 *   const { isEnabled, enable, disable, registerShortcut } = useKeyboardShortcuts({
 *     shortcuts: [
 *       {
 *         id: 'cancel',
 *         key: 'Escape',
 *         action: () => cancelSelection(),
 *         description: 'Cancel selection',
 *       },
 *       {
 *         id: 'submit',
 *         key: 'Enter',
 *         modifiers: ['ctrl'],
 *         action: () => submitFeedback(),
 *         description: 'Submit feedback',
 *       },
 *     ],
 *     onShortcutTriggered: (id) => console.log(`Shortcut ${id} triggered`),
 *   });
 *
 *   return (
 *     <div>
 *       <p>Press Escape to cancel, Ctrl+Enter to submit</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useKeyboardShortcuts(
  options: UseKeyboardShortcutsOptions = {}
): UseKeyboardShortcutsReturn {
  const {
    shortcuts: initialShortcuts = [],
    enabled: initialEnabled = true,
    onShortcutTriggered,
    preventDefault = true,
    stopPropagation = false,
    targetRef,
  } = options;

  // State
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>(initialShortcuts);

  // Refs for stable callback references
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const callbacksRef = useRef({ onShortcutTriggered, preventDefault, stopPropagation });
  callbacksRef.current = { onShortcutTriggered, preventDefault, stopPropagation };

  // Handle keydown event
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const currentShortcuts = shortcutsRef.current;
    const { onShortcutTriggered: callback, preventDefault: prevent, stopPropagation: stop } = callbacksRef.current;

    for (const shortcut of currentShortcuts) {
      // Skip disabled shortcuts
      if (shortcut.enabled === false) {
        continue;
      }

      if (matchesShortcut(event, shortcut)) {
        // Prevent default behavior if specified
        if (prevent) {
          event.preventDefault();
        }

        // Stop propagation if specified
        if (stop) {
          event.stopPropagation();
        }

        // Execute the action
        shortcut.action();

        // Notify callback
        callback?.(shortcut.id);

        // Only handle first matching shortcut
        break;
      }
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const target = targetRef?.current ?? document;

    target.addEventListener('keydown', handleKeyDown as EventListener);

    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [isEnabled, handleKeyDown, targetRef]);

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

  // Shortcut management methods
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts((prev) => {
      // Replace if exists, otherwise add
      const index = prev.findIndex((s) => s.id === shortcut.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = shortcut;
        return updated;
      }
      return [...prev, shortcut];
    });
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateShortcut = useCallback(
    (id: string, updates: Partial<Omit<KeyboardShortcut, 'id'>>) => {
      setShortcuts((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
    },
    []
  );

  const enableShortcut = useCallback((id: string) => {
    updateShortcut(id, { enabled: true });
  }, [updateShortcut]);

  const disableShortcut = useCallback((id: string) => {
    updateShortcut(id, { enabled: false });
  }, [updateShortcut]);

  const getShortcut = useCallback(
    (id: string) => shortcuts.find((s) => s.id === id),
    [shortcuts]
  );

  const hasShortcut = useCallback(
    (id: string) => shortcuts.some((s) => s.id === id),
    [shortcuts]
  );

  const clearShortcuts = useCallback(() => {
    setShortcuts([]);
  }, []);

  // Memoize return value
  return useMemo(
    () => ({
      isEnabled,
      shortcuts,
      enable,
      disable,
      toggle,
      registerShortcut,
      unregisterShortcut,
      updateShortcut,
      enableShortcut,
      disableShortcut,
      getShortcut,
      hasShortcut,
      clearShortcuts,
    }),
    [
      isEnabled,
      shortcuts,
      enable,
      disable,
      toggle,
      registerShortcut,
      unregisterShortcut,
      updateShortcut,
      enableShortcut,
      disableShortcut,
      getShortcut,
      hasShortcut,
      clearShortcuts,
    ]
  );
}

// Re-export types
export type {
  UseKeyboardShortcutsOptions,
  UseKeyboardShortcutsReturn,
  KeyboardShortcut,
  ModifierKey,
};
