/**
 * React Visual Feedback - useElementSelection Hook Tests
 *
 * Comprehensive tests for the useElementSelection hook covering:
 * - Initial state management
 * - Enable/disable functionality
 * - Mouse move handling
 * - Element selection (click)
 * - Highlight and tooltip style calculation
 * - Component info extraction
 * - Cleanup on unmount
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useElementSelection,
  UseElementSelectionOptions,
} from '../../../src/hooks/useElementSelection';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Creates a mock element with specified properties
 */
function createMockElement(options: {
  id?: string;
  tagName?: string;
  classList?: string[];
  rect?: Partial<DOMRect>;
} = {}): HTMLElement {
  const element = document.createElement(options.tagName || 'div');

  if (options.id) {
    element.id = options.id;
  }

  if (options.classList) {
    options.classList.forEach((cls) => element.classList.add(cls));
  }

  // Mock getBoundingClientRect
  const defaultRect: DOMRect = {
    left: 100,
    top: 100,
    width: 200,
    height: 100,
    right: 300,
    bottom: 200,
    x: 100,
    y: 100,
    toJSON: () => ({}),
  };

  element.getBoundingClientRect = vi.fn().mockReturnValue({
    ...defaultRect,
    ...options.rect,
  });

  return element;
}

/**
 * Creates a mock MouseEvent
 */
function createMouseEvent(
  type: string,
  options: { clientX?: number; clientY?: number } = {}
): MouseEvent {
  return new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: options.clientX ?? 150,
    clientY: options.clientY ?? 150,
  });
}

// ============================================================================
// Tests
// ============================================================================

describe('useElementSelection', () => {
  let mockElement: HTMLElement;
  let rafCallback: FrameRequestCallback | null = null;
  let originalElementFromPoint: typeof document.elementFromPoint;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb;
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => { });

    // Mock performance.now
    vi.spyOn(performance, 'now').mockReturnValue(1000);

    // Create and append mock element to document
    mockElement = createMockElement({ id: 'test-element' });
    document.body.appendChild(mockElement);

    // Store original and mock document.elementFromPoint
    originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = vi.fn().mockReturnValue(mockElement);
  });

  afterEach(() => {
    // Remove mock element
    if (mockElement && mockElement.parentNode) {
      mockElement.parentNode.removeChild(mockElement);
    }
    rafCallback = null;

    // Restore document.elementFromPoint
    document.elementFromPoint = originalElementFromPoint;

    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Initial State Tests
  // ==========================================================================

  describe('initial state', () => {
    it('should initialize with disabled state by default', () => {
      const { result } = renderHook(() => useElementSelection());

      expect(result.current.isEnabled).toBe(false);
      expect(result.current.hoveredElement).toBeNull();
      expect(result.current.selectedElement).toBeNull();
      expect(result.current.highlightStyle).toBeNull();
      expect(result.current.tooltipStyle).toBeNull();
    });

    it('should initialize with enabled state when enabled option is true', () => {
      const { result } = renderHook(() =>
        useElementSelection({ enabled: true })
      );

      expect(result.current.isEnabled).toBe(true);
    });

    it('should have null component info initially', () => {
      const { result } = renderHook(() => useElementSelection());

      expect(result.current.hoveredComponentInfo).toBeNull();
      expect(result.current.selectedComponentInfo).toBeNull();
    });
  });

  // ==========================================================================
  // Enable/Disable Tests
  // ==========================================================================

  describe('enable/disable', () => {
    it('should enable selection when enable is called', () => {
      const { result } = renderHook(() => useElementSelection());

      expect(result.current.isEnabled).toBe(false);

      act(() => {
        result.current.enable();
      });

      expect(result.current.isEnabled).toBe(true);
    });

    it('should disable selection when disable is called', () => {
      const { result } = renderHook(() =>
        useElementSelection({ enabled: true })
      );

      expect(result.current.isEnabled).toBe(true);

      act(() => {
        result.current.disable();
      });

      expect(result.current.isEnabled).toBe(false);
    });

    it('should toggle selection state', () => {
      const { result } = renderHook(() => useElementSelection());

      expect(result.current.isEnabled).toBe(false);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isEnabled).toBe(true);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isEnabled).toBe(false);
    });

    it('should clear hover state when disabled', () => {
      const { result } = renderHook(() =>
        useElementSelection({ enabled: true })
      );

      // Simulate mouse move to set hover state
      act(() => {
        const event = createMouseEvent('mousemove', { clientX: 150, clientY: 150 });
        document.dispatchEvent(event);
      });

      // Execute RAF callback
      act(() => {
        if (rafCallback) {
          rafCallback(performance.now());
        }
      });

      // Disable
      act(() => {
        result.current.disable();
      });

      expect(result.current.hoveredElement).toBeNull();
      expect(result.current.highlightStyle).toBeNull();
      expect(result.current.tooltipStyle).toBeNull();
    });

    it('should sync with enabled prop changes', () => {
      const { result, rerender } = renderHook(
        (props: UseElementSelectionOptions) => useElementSelection(props),
        { initialProps: { enabled: false } }
      );

      expect(result.current.isEnabled).toBe(false);

      rerender({ enabled: true });

      expect(result.current.isEnabled).toBe(true);
    });
  });

  // ==========================================================================
  // Mouse Move Handling Tests
  // ==========================================================================

  describe('mouse move handling', () => {
    it('should not track mouse when disabled', () => {
      const onElementHover = vi.fn();
      renderHook(() =>
        useElementSelection({ enabled: false, onElementHover })
      );

      act(() => {
        const event = createMouseEvent('mousemove');
        document.dispatchEvent(event);
      });

      // RAF callback should not be executed when disabled
      expect(onElementHover).not.toHaveBeenCalled();
    });

    it('should track hovered element when enabled', () => {
      const onElementHover = vi.fn();
      const { result } = renderHook(() =>
        useElementSelection({ enabled: true, onElementHover })
      );

      act(() => {
        const event = createMouseEvent('mousemove', { clientX: 150, clientY: 150 });
        document.dispatchEvent(event);
      });

      // Execute RAF callback
      act(() => {
        if (rafCallback) {
          rafCallback(performance.now());
        }
      });

      expect(result.current.hoveredElement).toBe(mockElement);
      expect(onElementHover).toHaveBeenCalledWith(
        expect.objectContaining({
          element: mockElement,
        })
      );
    });

    it('should calculate highlight style for hovered element', () => {
      const { result } = renderHook(() =>
        useElementSelection({ enabled: true })
      );

      act(() => {
        const event = createMouseEvent('mousemove', { clientX: 150, clientY: 150 });
        document.dispatchEvent(event);
      });

      act(() => {
        if (rafCallback) {
          rafCallback(performance.now());
        }
      });

      expect(result.current.highlightStyle).toEqual({
        left: 100,
        top: 100,
        width: 200,
        height: 100,
      });
    });

    it('should calculate tooltip style based on mouse position', () => {
      const { result } = renderHook(() =>
        useElementSelection({ enabled: true })
      );

      act(() => {
        const event = createMouseEvent('mousemove', { clientX: 200, clientY: 150 });
        document.dispatchEvent(event);
      });

      act(() => {
        if (rafCallback) {
          rafCallback(performance.now());
        }
      });

      expect(result.current.tooltipStyle).toEqual({
        left: 210, // clientX + 10
        top: 160, // clientY + 10
      });
    });

    it('should throttle mouse move events', () => {
      const onElementHover = vi.fn();
      renderHook(() =>
        useElementSelection({ enabled: true, onElementHover, throttleMs: 100 })
      );

      // First move at t=1000
      act(() => {
        vi.spyOn(performance, 'now').mockReturnValue(1000);
        const event = createMouseEvent('mousemove');
        document.dispatchEvent(event);
      });

      act(() => {
        if (rafCallback) {
          rafCallback(performance.now());
        }
      });

      expect(onElementHover).toHaveBeenCalledTimes(1);

      // Second move at t=1050 (within throttle window)
      act(() => {
        vi.spyOn(performance, 'now').mockReturnValue(1050);
        const event = createMouseEvent('mousemove');
        document.dispatchEvent(event);
      });

      // Should not trigger due to throttle
      expect(onElementHover).toHaveBeenCalledTimes(1);

      // Third move at t=1150 (outside throttle window)
      act(() => {
        vi.spyOn(performance, 'now').mockReturnValue(1150);
        const event = createMouseEvent('mousemove');
        document.dispatchEvent(event);
      });

      act(() => {
        if (rafCallback) {
          rafCallback(performance.now());
        }
      });

      expect(onElementHover).toHaveBeenCalledTimes(2);
    });

    it('should call onElementHover with null when no element at point', () => {
      const onElementHover = vi.fn();
      const { result } = renderHook(() =>
        useElementSelection({ enabled: true, onElementHover })
      );

      // First, hover over an element
      act(() => {
        const event = createMouseEvent('mousemove');
        document.dispatchEvent(event);
      });

      act(() => {
        if (rafCallback) {
          rafCallback(performance.now());
        }
      });

      expect(result.current.hoveredElement).toBe(mockElement);

      // Now move to empty space
      (document.elementFromPoint as ReturnType<typeof vi.fn>).mockReturnValue(null);

      act(() => {
        vi.spyOn(performance, 'now').mockReturnValue(2000); // Outside throttle
        const event = createMouseEvent('mousemove', { clientX: 0, clientY: 0 });
        document.dispatchEvent(event);
      });

      act(() => {
        if (rafCallback) {
          rafCallback(performance.now());
        }
      });

      expect(result.current.hoveredElement).toBeNull();
      expect(onElementHover).toHaveBeenLastCalledWith(null);
    });
  });

  // ==========================================================================
  // Element Selection (Click) Tests
  // ==========================================================================

  describe('element selection (click)', () => {
    it('should select element on click when enabled and hovering', () => {
      const onElementSelect = vi.fn();
      const { result } = renderHook(() =>
        useElementSelection({ enabled: true, onElementSelect })
      );

      // First hover
      act(() => {
        const event = createMouseEvent('mousemove');
        document.dispatchEvent(event);
      });

      act(() => {
        if (rafCallback) {
          rafCallback(performance.now());
        }
      });

      // Then click
      act(() => {
        const event = createMouseEvent('click');
        document.dispatchEvent(event);
      });

      expect(result.current.selectedElement).toBe(mockElement);
      expect(onElementSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          element: mockElement,
        })
      );
    });

    it('should not select when disabled', () => {
      const onElementSelect = vi.fn();
      renderHook(() =>
        useElementSelection({ enabled: false, onElementSelect })
      );

      act(() => {
        const event = createMouseEvent('click');
        document.dispatchEvent(event);
      });

      expect(onElementSelect).not.toHaveBeenCalled();
    });

    it('should not select when no element is hovered', () => {
      const onElementSelect = vi.fn();
      const { result } = renderHook(() =>
        useElementSelection({ enabled: true, onElementSelect })
      );

      // Click without hovering first
      act(() => {
        const event = createMouseEvent('click');
        document.dispatchEvent(event);
      });

      expect(result.current.selectedElement).toBeNull();
      expect(onElementSelect).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Clear Methods Tests
  // ==========================================================================

  describe('clear methods', () => {
    it('should clear selection', () => {
      const { result } = renderHook(() =>
        useElementSelection({ enabled: true })
      );

      // Hover and click to select
      act(() => {
        const event = createMouseEvent('mousemove');
        document.dispatchEvent(event);
      });

      act(() => {
        if (rafCallback) {
          rafCallback(performance.now());
        }
      });

      act(() => {
        const event = createMouseEvent('click');
        document.dispatchEvent(event);
      });

      expect(result.current.selectedElement).toBe(mockElement);

      // Clear selection
      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedElement).toBeNull();
    });

    it('should clear hover state', () => {
      const { result } = renderHook(() =>
        useElementSelection({ enabled: true })
      );

      // Hover
      act(() => {
        const event = createMouseEvent('mousemove');
        document.dispatchEvent(event);
      });

      act(() => {
        if (rafCallback) {
          rafCallback(performance.now());
        }
      });

      expect(result.current.hoveredElement).toBe(mockElement);

      // Clear hover
      act(() => {
        result.current.clearHover();
      });

      expect(result.current.hoveredElement).toBeNull();
      expect(result.current.highlightStyle).toBeNull();
      expect(result.current.tooltipStyle).toBeNull();
    });
  });

  // ==========================================================================
  // Exclude Selector Tests
  // ==========================================================================

  describe('exclude selector', () => {
    it('should not select elements matching exclude selector', () => {
      const excludedElement = createMockElement({
        id: 'excluded-element',
        classList: ['feedback-ui'],
      });
      document.body.appendChild(excludedElement);
      (document.elementFromPoint as ReturnType<typeof vi.fn>).mockReturnValue(excludedElement);

      const onElementHover = vi.fn();
      renderHook(() =>
        useElementSelection({
          enabled: true,
          excludeSelector: '.feedback-ui',
          onElementHover,
        })
      );

      act(() => {
        const event = createMouseEvent('mousemove');
        document.dispatchEvent(event);
      });

      act(() => {
        if (rafCallback) {
          rafCallback(performance.now());
        }
      });

      // Should not trigger callback for excluded element
      expect(onElementHover).not.toHaveBeenCalled();

      // Cleanup
      excludedElement.parentNode?.removeChild(excludedElement);
    });
  });

  // ==========================================================================
  // Element Info Tests
  // ==========================================================================

  describe('element info', () => {
    it('should provide element info with selector', () => {
      const { result } = renderHook(() =>
        useElementSelection({ enabled: true })
      );

      act(() => {
        const event = createMouseEvent('mousemove');
        document.dispatchEvent(event);
      });

      act(() => {
        if (rafCallback) {
          rafCallback(performance.now());
        }
      });

      expect(result.current.hoveredElementInfo).toEqual(
        expect.objectContaining({
          element: mockElement,
          selector: '#test-element',
          rect: expect.any(Object),
        })
      );
    });

    it('should generate selector with class when no id', () => {
      const elementWithClass = createMockElement({
        tagName: 'button',
        classList: ['primary', 'large'],
      });
      document.body.appendChild(elementWithClass);
      (document.elementFromPoint as ReturnType<typeof vi.fn>).mockReturnValue(elementWithClass);

      const { result } = renderHook(() =>
        useElementSelection({ enabled: true })
      );

      act(() => {
        const event = createMouseEvent('mousemove');
        document.dispatchEvent(event);
      });

      act(() => {
        if (rafCallback) {
          rafCallback(performance.now());
        }
      });

      expect(result.current.hoveredElementInfo?.selector).toBe('button.primary.large');

      // Cleanup
      elementWithClass.parentNode?.removeChild(elementWithClass);
    });
  });

  // ==========================================================================
  // Cleanup Tests
  // ==========================================================================

  describe('cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = renderHook(() =>
        useElementSelection({ enabled: true })
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'click',
        expect.any(Function),
        { capture: true }
      );
    });

    it('should cancel pending RAF on unmount', () => {
      const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame');

      const { unmount } = renderHook(() =>
        useElementSelection({ enabled: true })
      );

      // Trigger a mouse move to create a pending RAF
      act(() => {
        const event = createMouseEvent('mousemove');
        document.dispatchEvent(event);
      });

      unmount();

      expect(cancelAnimationFrameSpy).toHaveBeenCalled();
    });
  });
});
