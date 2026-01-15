/**
 * React Visual Feedback - useKeyboardShortcuts Hook Tests
 *
 * Comprehensive tests for the useKeyboardShortcuts hook covering:
 * - Initial state management
 * - Enable/disable functionality
 * - Shortcut matching with modifiers
 * - Dynamic shortcut registration
 * - Shortcut updates and removal
 * - Cleanup on unmount
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useKeyboardShortcuts,
  formatShortcut,
  KeyboardShortcut,
} from '../../../src/hooks/useKeyboardShortcuts';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Creates a mock KeyboardEvent
 */
function createKeyboardEvent(
  key: string,
  options: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
  } = {}
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ctrlKey: options.ctrlKey ?? false,
    shiftKey: options.shiftKey ?? false,
    altKey: options.altKey ?? false,
    metaKey: options.metaKey ?? false,
  });
}

/**
 * Creates a basic shortcut for testing
 */
function createShortcut(overrides: Partial<KeyboardShortcut> = {}): KeyboardShortcut {
  return {
    id: 'test-shortcut',
    key: 'Escape',
    action: vi.fn(),
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Initial State Tests
  // ==========================================================================

  describe('initial state', () => {
    it('should initialize with enabled state by default', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      expect(result.current.isEnabled).toBe(true);
      expect(result.current.shortcuts).toEqual([]);
    });

    it('should initialize with provided shortcuts', () => {
      const shortcuts = [
        createShortcut({ id: 'cancel', key: 'Escape' }),
        createShortcut({ id: 'submit', key: 'Enter' }),
      ];

      const { result } = renderHook(() =>
        useKeyboardShortcuts({ shortcuts })
      );

      expect(result.current.shortcuts).toHaveLength(2);
      expect(result.current.shortcuts[0].id).toBe('cancel');
      expect(result.current.shortcuts[1].id).toBe('submit');
    });

    it('should initialize with disabled state when enabled is false', () => {
      const { result } = renderHook(() =>
        useKeyboardShortcuts({ enabled: false })
      );

      expect(result.current.isEnabled).toBe(false);
    });
  });

  // ==========================================================================
  // Enable/Disable Tests
  // ==========================================================================

  describe('enable/disable', () => {
    it('should enable keyboard handling', () => {
      const { result } = renderHook(() =>
        useKeyboardShortcuts({ enabled: false })
      );

      expect(result.current.isEnabled).toBe(false);

      act(() => {
        result.current.enable();
      });

      expect(result.current.isEnabled).toBe(true);
    });

    it('should disable keyboard handling', () => {
      const { result } = renderHook(() =>
        useKeyboardShortcuts({ enabled: true })
      );

      expect(result.current.isEnabled).toBe(true);

      act(() => {
        result.current.disable();
      });

      expect(result.current.isEnabled).toBe(false);
    });

    it('should toggle keyboard handling', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      expect(result.current.isEnabled).toBe(true);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isEnabled).toBe(false);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isEnabled).toBe(true);
    });

    it('should not trigger shortcuts when disabled', () => {
      const action = vi.fn();
      const shortcuts = [createShortcut({ id: 'test', key: 'Escape', action })];

      renderHook(() =>
        useKeyboardShortcuts({ shortcuts, enabled: false })
      );

      act(() => {
        document.dispatchEvent(createKeyboardEvent('Escape'));
      });

      expect(action).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Shortcut Matching Tests
  // ==========================================================================

  describe('shortcut matching', () => {
    it('should trigger action for matching key', () => {
      const action = vi.fn();
      const shortcuts = [createShortcut({ id: 'escape', key: 'Escape', action })];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      act(() => {
        document.dispatchEvent(createKeyboardEvent('Escape'));
      });

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should not trigger action for non-matching key', () => {
      const action = vi.fn();
      const shortcuts = [createShortcut({ id: 'escape', key: 'Escape', action })];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      act(() => {
        document.dispatchEvent(createKeyboardEvent('Enter'));
      });

      expect(action).not.toHaveBeenCalled();
    });

    it('should match key case-insensitively', () => {
      const action = vi.fn();
      const shortcuts = [createShortcut({ id: 'a', key: 'a', action })];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      act(() => {
        document.dispatchEvent(createKeyboardEvent('A'));
      });

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should trigger action with Ctrl modifier', () => {
      const action = vi.fn();
      const shortcuts = [
        createShortcut({ id: 'ctrl-s', key: 's', modifiers: ['ctrl'], action }),
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      // Without Ctrl - should not trigger
      act(() => {
        document.dispatchEvent(createKeyboardEvent('s'));
      });

      expect(action).not.toHaveBeenCalled();

      // With Ctrl - should trigger
      act(() => {
        document.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));
      });

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should trigger action with Shift modifier', () => {
      const action = vi.fn();
      const shortcuts = [
        createShortcut({ id: 'shift-enter', key: 'Enter', modifiers: ['shift'], action }),
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      act(() => {
        document.dispatchEvent(createKeyboardEvent('Enter', { shiftKey: true }));
      });

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should trigger action with Alt modifier', () => {
      const action = vi.fn();
      const shortcuts = [
        createShortcut({ id: 'alt-d', key: 'd', modifiers: ['alt'], action }),
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      act(() => {
        document.dispatchEvent(createKeyboardEvent('d', { altKey: true }));
      });

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should trigger action with multiple modifiers', () => {
      const action = vi.fn();
      const shortcuts = [
        createShortcut({
          id: 'ctrl-shift-s',
          key: 's',
          modifiers: ['ctrl', 'shift'],
          action,
        }),
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      // With only Ctrl - should not trigger
      act(() => {
        document.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));
      });

      expect(action).not.toHaveBeenCalled();

      // With both Ctrl and Shift - should trigger
      act(() => {
        document.dispatchEvent(
          createKeyboardEvent('s', { ctrlKey: true, shiftKey: true })
        );
      });

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should not trigger when extra modifiers are pressed', () => {
      const action = vi.fn();
      const shortcuts = [createShortcut({ id: 's', key: 's', action })];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      // With Ctrl - should not trigger (no modifiers expected)
      act(() => {
        document.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));
      });

      expect(action).not.toHaveBeenCalled();
    });

    it('should call onShortcutTriggered callback', () => {
      const action = vi.fn();
      const onShortcutTriggered = vi.fn();
      const shortcuts = [createShortcut({ id: 'test-id', key: 'Escape', action })];

      renderHook(() =>
        useKeyboardShortcuts({ shortcuts, onShortcutTriggered })
      );

      act(() => {
        document.dispatchEvent(createKeyboardEvent('Escape'));
      });

      expect(onShortcutTriggered).toHaveBeenCalledWith('test-id');
    });

    it('should not trigger disabled shortcuts', () => {
      const action = vi.fn();
      const shortcuts = [
        createShortcut({ id: 'disabled', key: 'Escape', action, enabled: false }),
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      act(() => {
        document.dispatchEvent(createKeyboardEvent('Escape'));
      });

      expect(action).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Shortcut Registration Tests
  // ==========================================================================

  describe('shortcut registration', () => {
    it('should register a new shortcut', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      expect(result.current.shortcuts).toHaveLength(0);

      act(() => {
        result.current.registerShortcut(createShortcut({ id: 'new', key: 'n' }));
      });

      expect(result.current.shortcuts).toHaveLength(1);
      expect(result.current.shortcuts[0].id).toBe('new');
    });

    it('should replace existing shortcut with same id', () => {
      const { result } = renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [createShortcut({ id: 'test', key: 'a' })],
        })
      );

      expect(result.current.shortcuts[0].key).toBe('a');

      act(() => {
        result.current.registerShortcut(createShortcut({ id: 'test', key: 'b' }));
      });

      expect(result.current.shortcuts).toHaveLength(1);
      expect(result.current.shortcuts[0].key).toBe('b');
    });

    it('should unregister a shortcut', () => {
      const { result } = renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [
            createShortcut({ id: 'keep', key: 'a' }),
            createShortcut({ id: 'remove', key: 'b' }),
          ],
        })
      );

      expect(result.current.shortcuts).toHaveLength(2);

      act(() => {
        result.current.unregisterShortcut('remove');
      });

      expect(result.current.shortcuts).toHaveLength(1);
      expect(result.current.shortcuts[0].id).toBe('keep');
    });

    it('should update a shortcut', () => {
      const { result } = renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [createShortcut({ id: 'test', key: 'a', enabled: true })],
        })
      );

      act(() => {
        result.current.updateShortcut('test', { key: 'b', enabled: false });
      });

      expect(result.current.shortcuts[0].key).toBe('b');
      expect(result.current.shortcuts[0].enabled).toBe(false);
    });

    it('should enable a shortcut', () => {
      const { result } = renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [createShortcut({ id: 'test', key: 'a', enabled: false })],
        })
      );

      expect(result.current.shortcuts[0].enabled).toBe(false);

      act(() => {
        result.current.enableShortcut('test');
      });

      expect(result.current.shortcuts[0].enabled).toBe(true);
    });

    it('should disable a shortcut', () => {
      const { result } = renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [createShortcut({ id: 'test', key: 'a', enabled: true })],
        })
      );

      act(() => {
        result.current.disableShortcut('test');
      });

      expect(result.current.shortcuts[0].enabled).toBe(false);
    });

    it('should get a shortcut by id', () => {
      const { result } = renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [createShortcut({ id: 'find-me', key: 'f' })],
        })
      );

      const shortcut = result.current.getShortcut('find-me');

      expect(shortcut).toBeDefined();
      expect(shortcut?.key).toBe('f');
    });

    it('should return undefined for non-existent shortcut', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      const shortcut = result.current.getShortcut('does-not-exist');

      expect(shortcut).toBeUndefined();
    });

    it('should check if shortcut exists', () => {
      const { result } = renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [createShortcut({ id: 'exists', key: 'e' })],
        })
      );

      expect(result.current.hasShortcut('exists')).toBe(true);
      expect(result.current.hasShortcut('not-exists')).toBe(false);
    });

    it('should clear all shortcuts', () => {
      const { result } = renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [
            createShortcut({ id: 'a', key: 'a' }),
            createShortcut({ id: 'b', key: 'b' }),
          ],
        })
      );

      expect(result.current.shortcuts).toHaveLength(2);

      act(() => {
        result.current.clearShortcuts();
      });

      expect(result.current.shortcuts).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Event Options Tests
  // ==========================================================================

  describe('event options', () => {
    it('should prevent default when preventDefault is true', () => {
      const shortcuts = [createShortcut({ id: 'test', key: 'Escape' })];

      renderHook(() =>
        useKeyboardShortcuts({ shortcuts, preventDefault: true })
      );

      const event = createKeyboardEvent('Escape');
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      act(() => {
        document.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not prevent default when preventDefault is false', () => {
      const shortcuts = [createShortcut({ id: 'test', key: 'Escape' })];

      renderHook(() =>
        useKeyboardShortcuts({ shortcuts, preventDefault: false })
      );

      const event = createKeyboardEvent('Escape');
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      act(() => {
        document.dispatchEvent(event);
      });

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should stop propagation when stopPropagation is true', () => {
      const shortcuts = [createShortcut({ id: 'test', key: 'Escape' })];

      renderHook(() =>
        useKeyboardShortcuts({ shortcuts, stopPropagation: true })
      );

      const event = createKeyboardEvent('Escape');
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

      act(() => {
        document.dispatchEvent(event);
      });

      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Cleanup Tests
  // ==========================================================================

  describe('cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [createShortcut({ id: 'test', key: 'Escape' })],
        })
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('should remove event listeners when disabled', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { result } = renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [createShortcut({ id: 'test', key: 'Escape' })],
        })
      );

      act(() => {
        result.current.disable();
      });

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });
  });

  // ==========================================================================
  // formatShortcut Tests
  // ==========================================================================

  describe('formatShortcut', () => {
    it('should format simple key', () => {
      const shortcut = createShortcut({ id: 'esc', key: 'Escape' });
      expect(formatShortcut(shortcut)).toBe('Escape');
    });

    it('should capitalize single letter keys', () => {
      const shortcut = createShortcut({ id: 's', key: 's' });
      expect(formatShortcut(shortcut)).toBe('S');
    });

    it('should format key with Ctrl modifier', () => {
      const shortcut = createShortcut({ id: 'ctrl-s', key: 's', modifiers: ['ctrl'] });
      // Result depends on platform, but should contain the key
      const formatted = formatShortcut(shortcut);
      expect(formatted).toMatch(/S$/);
    });

    it('should format key with multiple modifiers', () => {
      const shortcut = createShortcut({
        id: 'ctrl-shift-s',
        key: 's',
        modifiers: ['ctrl', 'shift'],
      });
      const formatted = formatShortcut(shortcut);
      expect(formatted).toMatch(/S$/);
    });
  });
});
