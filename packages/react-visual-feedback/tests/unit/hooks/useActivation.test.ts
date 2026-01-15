/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActivation } from '../../../src/hooks/useActivation';
import type { UseActivationOptions } from '../../../src/hooks/useActivation';

describe('useActivation', () => {
  // ============================================================================
  // Uncontrolled Mode Tests
  // ============================================================================

  describe('uncontrolled mode', () => {
    it('should initialize with default inactive state', () => {
      const { result } = renderHook(() => useActivation());

      expect(result.current.isActive).toBe(false);
      expect(result.current.isControlled).toBe(false);
    });

    it('should initialize with defaultOpen=true', () => {
      const { result } = renderHook(() => useActivation({ defaultOpen: true }));

      expect(result.current.isActive).toBe(true);
      expect(result.current.isControlled).toBe(false);
    });

    it('should initialize with defaultOpen=false', () => {
      const { result } = renderHook(() => useActivation({ defaultOpen: false }));

      expect(result.current.isActive).toBe(false);
      expect(result.current.isControlled).toBe(false);
    });

    it('should toggle activation state', () => {
      const { result } = renderHook(() => useActivation());

      expect(result.current.isActive).toBe(false);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should activate', () => {
      const { result } = renderHook(() => useActivation());

      expect(result.current.isActive).toBe(false);

      act(() => {
        result.current.activate();
      });

      expect(result.current.isActive).toBe(true);
    });

    it('should deactivate', () => {
      const { result } = renderHook(() => useActivation({ defaultOpen: true }));

      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.deactivate();
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should setIsActive with direct value', () => {
      const { result } = renderHook(() => useActivation());

      act(() => {
        result.current.setIsActive(true);
      });

      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.setIsActive(false);
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should setIsActive with updater function', () => {
      const { result } = renderHook(() => useActivation());

      act(() => {
        result.current.setIsActive((prev) => !prev);
      });

      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.setIsActive((prev) => !prev);
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should maintain state across multiple toggles', () => {
      const { result } = renderHook(() => useActivation());

      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.toggle();
        });
        expect(result.current.isActive).toBe(true);

        act(() => {
          result.current.toggle();
        });
        expect(result.current.isActive).toBe(false);
      }
    });

    it('should handle activate when already active', () => {
      const { result } = renderHook(() => useActivation({ defaultOpen: true }));

      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.activate();
      });

      expect(result.current.isActive).toBe(true);
    });

    it('should handle deactivate when already inactive', () => {
      const { result } = renderHook(() => useActivation());

      expect(result.current.isActive).toBe(false);

      act(() => {
        result.current.deactivate();
      });

      expect(result.current.isActive).toBe(false);
    });
  });

  // ============================================================================
  // Controlled Mode Tests
  // ============================================================================

  describe('controlled mode', () => {
    it('should be in controlled mode when controlledIsActive is provided', () => {
      const { result } = renderHook(() =>
        useActivation({ controlledIsActive: false })
      );

      expect(result.current.isControlled).toBe(true);
    });

    it('should reflect controlled state (active)', () => {
      const { result } = renderHook(() =>
        useActivation({ controlledIsActive: true })
      );

      expect(result.current.isActive).toBe(true);
    });

    it('should reflect controlled state (inactive)', () => {
      const { result } = renderHook(() =>
        useActivation({ controlledIsActive: false })
      );

      expect(result.current.isActive).toBe(false);
    });

    it('should call onActiveChange when toggle is called', () => {
      const onActiveChange = vi.fn();
      const { result } = renderHook(() =>
        useActivation({
          controlledIsActive: false,
          onActiveChange,
        })
      );

      act(() => {
        result.current.toggle();
      });

      expect(onActiveChange).toHaveBeenCalledWith(true);
    });

    it('should call onActiveChange when activate is called', () => {
      const onActiveChange = vi.fn();
      const { result } = renderHook(() =>
        useActivation({
          controlledIsActive: false,
          onActiveChange,
        })
      );

      act(() => {
        result.current.activate();
      });

      expect(onActiveChange).toHaveBeenCalledWith(true);
    });

    it('should call onActiveChange when deactivate is called', () => {
      const onActiveChange = vi.fn();
      const { result } = renderHook(() =>
        useActivation({
          controlledIsActive: true,
          onActiveChange,
        })
      );

      act(() => {
        result.current.deactivate();
      });

      expect(onActiveChange).toHaveBeenCalledWith(false);
    });

    it('should call onActiveChange with direct value from setIsActive', () => {
      const onActiveChange = vi.fn();
      const { result } = renderHook(() =>
        useActivation({
          controlledIsActive: false,
          onActiveChange,
        })
      );

      act(() => {
        result.current.setIsActive(true);
      });

      expect(onActiveChange).toHaveBeenCalledWith(true);
    });

    it('should call onActiveChange with computed value from setIsActive updater', () => {
      const onActiveChange = vi.fn();
      const { result } = renderHook(() =>
        useActivation({
          controlledIsActive: false,
          onActiveChange,
        })
      );

      act(() => {
        result.current.setIsActive((prev) => !prev);
      });

      expect(onActiveChange).toHaveBeenCalledWith(true);
    });

    it('should update when controlled state changes', () => {
      const onActiveChange = vi.fn();
      const { result, rerender } = renderHook(
        (props: UseActivationOptions) => useActivation(props),
        {
          initialProps: {
            controlledIsActive: false,
            onActiveChange,
          },
        }
      );

      expect(result.current.isActive).toBe(false);

      rerender({
        controlledIsActive: true,
        onActiveChange,
      });

      expect(result.current.isActive).toBe(true);
    });

    it('should not call onActiveChange when not provided', () => {
      // This should not throw
      const { result } = renderHook(() =>
        useActivation({ controlledIsActive: false })
      );

      expect(() => {
        act(() => {
          result.current.toggle();
        });
      }).not.toThrow();
    });

    it('should ignore defaultOpen in controlled mode', () => {
      const { result } = renderHook(() =>
        useActivation({
          controlledIsActive: false,
          defaultOpen: true, // Should be ignored
        })
      );

      expect(result.current.isActive).toBe(false);
    });
  });

  // ============================================================================
  // Callback Stability Tests
  // ============================================================================

  describe('callback stability', () => {
    it('should maintain stable setIsActive reference', () => {
      const { result, rerender } = renderHook(() => useActivation());

      const firstSetIsActive = result.current.setIsActive;

      rerender();

      expect(result.current.setIsActive).toBe(firstSetIsActive);
    });

    it('should maintain stable toggle reference', () => {
      const { result, rerender } = renderHook(() => useActivation());

      const firstToggle = result.current.toggle;

      rerender();

      expect(result.current.toggle).toBe(firstToggle);
    });

    it('should maintain stable activate reference', () => {
      const { result, rerender } = renderHook(() => useActivation());

      const firstActivate = result.current.activate;

      rerender();

      expect(result.current.activate).toBe(firstActivate);
    });

    it('should maintain stable deactivate reference', () => {
      const { result, rerender } = renderHook(() => useActivation());

      const firstDeactivate = result.current.deactivate;

      rerender();

      expect(result.current.deactivate).toBe(firstDeactivate);
    });

    it('should update callbacks when dependencies change in controlled mode', () => {
      const onActiveChange1 = vi.fn();
      const onActiveChange2 = vi.fn();

      const { result, rerender } = renderHook(
        (props: UseActivationOptions) => useActivation(props),
        {
          initialProps: {
            controlledIsActive: false,
            onActiveChange: onActiveChange1,
          },
        }
      );

      const firstSetIsActive = result.current.setIsActive;

      rerender({
        controlledIsActive: false,
        onActiveChange: onActiveChange2,
      });

      // setIsActive should be updated to use new onActiveChange
      expect(result.current.setIsActive).not.toBe(firstSetIsActive);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('edge cases', () => {
    it('should handle rapid toggles correctly', () => {
      const { result } = renderHook(() => useActivation());

      act(() => {
        result.current.toggle();
        result.current.toggle();
        result.current.toggle();
      });

      expect(result.current.isActive).toBe(true);
    });

    it('should handle multiple activates correctly', () => {
      const { result } = renderHook(() => useActivation());

      act(() => {
        result.current.activate();
        result.current.activate();
        result.current.activate();
      });

      expect(result.current.isActive).toBe(true);
    });

    it('should handle multiple deactivates correctly', () => {
      const { result } = renderHook(() => useActivation({ defaultOpen: true }));

      act(() => {
        result.current.deactivate();
        result.current.deactivate();
        result.current.deactivate();
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should work with empty options object', () => {
      const { result } = renderHook(() => useActivation({}));

      expect(result.current.isActive).toBe(false);
      expect(result.current.isControlled).toBe(false);
    });

    it('should work with no options', () => {
      const { result } = renderHook(() => useActivation());

      expect(result.current.isActive).toBe(false);
      expect(result.current.isControlled).toBe(false);
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('integration', () => {
    it('should support switching from uncontrolled to controlled mode', () => {
      const onActiveChange = vi.fn();
      const { result, rerender } = renderHook(
        (props: UseActivationOptions) => useActivation(props),
        {
          initialProps: { defaultOpen: true },
        }
      );

      expect(result.current.isActive).toBe(true);
      expect(result.current.isControlled).toBe(false);

      // Switch to controlled mode
      rerender({
        controlledIsActive: false,
        onActiveChange,
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.isControlled).toBe(true);
    });

    it('should handle controlled toggle correctly with external state', () => {
      let externalState = false;
      const onActiveChange = vi.fn((newValue: boolean) => {
        externalState = newValue;
      });

      const { result, rerender } = renderHook(
        (props: UseActivationOptions) => useActivation(props),
        {
          initialProps: {
            controlledIsActive: externalState,
            onActiveChange,
          },
        }
      );

      expect(result.current.isActive).toBe(false);

      act(() => {
        result.current.toggle();
      });

      expect(onActiveChange).toHaveBeenCalledWith(true);

      // Simulate external state update
      rerender({
        controlledIsActive: externalState,
        onActiveChange,
      });

      expect(result.current.isActive).toBe(true);
    });
  });
});
