/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboard } from '../../../src/hooks/useDashboard';
import type { UseDashboardOptions } from '../../../src/hooks/useDashboard';

describe('useDashboard', () => {
  // ============================================================================
  // Uncontrolled Mode Tests
  // ============================================================================

  describe('uncontrolled mode', () => {
    it('should initialize with default closed state', () => {
      const { result } = renderHook(() => useDashboard());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.isControlled).toBe(false);
    });

    it('should initialize with defaultOpen=true', () => {
      const { result } = renderHook(() => useDashboard({ defaultOpen: true }));

      expect(result.current.isOpen).toBe(true);
      expect(result.current.isControlled).toBe(false);
    });

    it('should initialize with defaultOpen=false', () => {
      const { result } = renderHook(() => useDashboard({ defaultOpen: false }));

      expect(result.current.isOpen).toBe(false);
      expect(result.current.isControlled).toBe(false);
    });

    it('should open the dashboard', () => {
      const { result } = renderHook(() => useDashboard());

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should close the dashboard', () => {
      const { result } = renderHook(() => useDashboard({ defaultOpen: true }));

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should toggle the dashboard', () => {
      const { result } = renderHook(() => useDashboard());

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should setIsOpen with direct value', () => {
      const { result } = renderHook(() => useDashboard());

      act(() => {
        result.current.setIsOpen(true);
      });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.setIsOpen(false);
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should setIsOpen with updater function', () => {
      const { result } = renderHook(() => useDashboard());

      act(() => {
        result.current.setIsOpen((prev) => !prev);
      });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.setIsOpen((prev) => !prev);
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should handle open when already open', () => {
      const { result } = renderHook(() => useDashboard({ defaultOpen: true }));

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should handle close when already closed', () => {
      const { result } = renderHook(() => useDashboard());

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should maintain state across multiple toggles', () => {
      const { result } = renderHook(() => useDashboard());

      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.toggle();
        });
        expect(result.current.isOpen).toBe(true);

        act(() => {
          result.current.toggle();
        });
        expect(result.current.isOpen).toBe(false);
      }
    });
  });

  // ============================================================================
  // Controlled Mode Tests
  // ============================================================================

  describe('controlled mode', () => {
    it('should be in controlled mode when controlledIsOpen is provided', () => {
      const { result } = renderHook(() =>
        useDashboard({ controlledIsOpen: false })
      );

      expect(result.current.isControlled).toBe(true);
    });

    it('should reflect controlled state (open)', () => {
      const { result } = renderHook(() =>
        useDashboard({ controlledIsOpen: true })
      );

      expect(result.current.isOpen).toBe(true);
    });

    it('should reflect controlled state (closed)', () => {
      const { result } = renderHook(() =>
        useDashboard({ controlledIsOpen: false })
      );

      expect(result.current.isOpen).toBe(false);
    });

    it('should call onOpenChange when open is called', () => {
      const onOpenChange = vi.fn();
      const { result } = renderHook(() =>
        useDashboard({
          controlledIsOpen: false,
          onOpenChange,
        })
      );

      act(() => {
        result.current.open();
      });

      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('should call onOpenChange when close is called', () => {
      const onOpenChange = vi.fn();
      const { result } = renderHook(() =>
        useDashboard({
          controlledIsOpen: true,
          onOpenChange,
        })
      );

      act(() => {
        result.current.close();
      });

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange when toggle is called', () => {
      const onOpenChange = vi.fn();
      const { result } = renderHook(() =>
        useDashboard({
          controlledIsOpen: false,
          onOpenChange,
        })
      );

      act(() => {
        result.current.toggle();
      });

      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('should call onOpenChange with direct value from setIsOpen', () => {
      const onOpenChange = vi.fn();
      const { result } = renderHook(() =>
        useDashboard({
          controlledIsOpen: false,
          onOpenChange,
        })
      );

      act(() => {
        result.current.setIsOpen(true);
      });

      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('should call onOpenChange with computed value from setIsOpen updater', () => {
      const onOpenChange = vi.fn();
      const { result } = renderHook(() =>
        useDashboard({
          controlledIsOpen: false,
          onOpenChange,
        })
      );

      act(() => {
        result.current.setIsOpen((prev) => !prev);
      });

      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('should update when controlled state changes', () => {
      const onOpenChange = vi.fn();
      const { result, rerender } = renderHook(
        (props: UseDashboardOptions) => useDashboard(props),
        {
          initialProps: {
            controlledIsOpen: false,
            onOpenChange,
          },
        }
      );

      expect(result.current.isOpen).toBe(false);

      rerender({
        controlledIsOpen: true,
        onOpenChange,
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should not call onOpenChange when not provided', () => {
      const { result } = renderHook(() =>
        useDashboard({ controlledIsOpen: false })
      );

      expect(() => {
        act(() => {
          result.current.toggle();
        });
      }).not.toThrow();
    });

    it('should ignore defaultOpen in controlled mode', () => {
      const { result } = renderHook(() =>
        useDashboard({
          controlledIsOpen: false,
          defaultOpen: true, // Should be ignored
        })
      );

      expect(result.current.isOpen).toBe(false);
    });
  });

  // ============================================================================
  // Callback Stability Tests
  // ============================================================================

  describe('callback stability', () => {
    it('should maintain stable setIsOpen reference', () => {
      const { result, rerender } = renderHook(() => useDashboard());

      const firstSetIsOpen = result.current.setIsOpen;

      rerender();

      expect(result.current.setIsOpen).toBe(firstSetIsOpen);
    });

    it('should maintain stable open reference', () => {
      const { result, rerender } = renderHook(() => useDashboard());

      const firstOpen = result.current.open;

      rerender();

      expect(result.current.open).toBe(firstOpen);
    });

    it('should maintain stable close reference', () => {
      const { result, rerender } = renderHook(() => useDashboard());

      const firstClose = result.current.close;

      rerender();

      expect(result.current.close).toBe(firstClose);
    });

    it('should maintain stable toggle reference', () => {
      const { result, rerender } = renderHook(() => useDashboard());

      const firstToggle = result.current.toggle;

      rerender();

      expect(result.current.toggle).toBe(firstToggle);
    });

    it('should update callbacks when dependencies change in controlled mode', () => {
      const onOpenChange1 = vi.fn();
      const onOpenChange2 = vi.fn();

      const { result, rerender } = renderHook(
        (props: UseDashboardOptions) => useDashboard(props),
        {
          initialProps: {
            controlledIsOpen: false,
            onOpenChange: onOpenChange1,
          },
        }
      );

      const firstSetIsOpen = result.current.setIsOpen;

      rerender({
        controlledIsOpen: false,
        onOpenChange: onOpenChange2,
      });

      // setIsOpen should be updated to use new onOpenChange
      expect(result.current.setIsOpen).not.toBe(firstSetIsOpen);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('edge cases', () => {
    it('should handle rapid toggles correctly', () => {
      const { result } = renderHook(() => useDashboard());

      act(() => {
        result.current.toggle();
        result.current.toggle();
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should handle multiple opens correctly', () => {
      const { result } = renderHook(() => useDashboard());

      act(() => {
        result.current.open();
        result.current.open();
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should handle multiple closes correctly', () => {
      const { result } = renderHook(() => useDashboard({ defaultOpen: true }));

      act(() => {
        result.current.close();
        result.current.close();
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should work with empty options object', () => {
      const { result } = renderHook(() => useDashboard({}));

      expect(result.current.isOpen).toBe(false);
      expect(result.current.isControlled).toBe(false);
    });

    it('should work with no options', () => {
      const { result } = renderHook(() => useDashboard());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.isControlled).toBe(false);
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('integration', () => {
    it('should support switching from uncontrolled to controlled mode', () => {
      const onOpenChange = vi.fn();
      const { result, rerender } = renderHook(
        (props: UseDashboardOptions) => useDashboard(props),
        {
          initialProps: { defaultOpen: true },
        }
      );

      expect(result.current.isOpen).toBe(true);
      expect(result.current.isControlled).toBe(false);

      // Switch to controlled mode
      rerender({
        controlledIsOpen: false,
        onOpenChange,
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.isControlled).toBe(true);
    });

    it('should handle controlled toggle correctly with external state', () => {
      let externalState = false;
      const onOpenChange = vi.fn((newValue: boolean) => {
        externalState = newValue;
      });

      const { result, rerender } = renderHook(
        (props: UseDashboardOptions) => useDashboard(props),
        {
          initialProps: {
            controlledIsOpen: externalState,
            onOpenChange,
          },
        }
      );

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.toggle();
      });

      expect(onOpenChange).toHaveBeenCalledWith(true);

      // Simulate external state update
      rerender({
        controlledIsOpen: externalState,
        onOpenChange,
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should work with open/close sequence', () => {
      const { result } = renderHook(() => useDashboard());

      // Open
      act(() => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);

      // Close
      act(() => {
        result.current.close();
      });
      expect(result.current.isOpen).toBe(false);

      // Open again
      act(() => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);
    });
  });
});
