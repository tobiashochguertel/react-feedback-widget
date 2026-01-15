# useElementSelection

> **Updated:** 2026-01-16
> **Related:** [Hooks Overview](./README.md)

## Purpose

Manages element selection via mouse interaction for highlighting and selecting DOM elements.

## Import

```typescript
import { useElementSelection } from 'react-visual-feedback';
import type { UseElementSelectionOptions, UseElementSelectionReturn } from 'react-visual-feedback';
```

## API

### Options

```typescript
interface UseElementSelectionOptions {
  /** Whether element selection is enabled */
  enabled?: boolean;

  /** Throttle interval for mouse move events (ms) */
  throttleMs?: number;

  /** Container element to scope selection to */
  containerRef?: React.RefObject<HTMLElement | null>;

  /** Callback when an element is hovered */
  onElementHover?: (info: ElementInfo | null) => void;

  /** Callback when an element is selected (clicked) */
  onElementSelect?: (info: ElementInfo) => void;

  /** CSS selector for elements to exclude from selection */
  excludeSelector?: string;
}
```

### Types

```typescript
interface ComponentInfo {
  /** React component name */
  name: string;
  /** File path if available (dev mode) */
  filePath?: string;
  /** Line number if available */
  lineNumber?: number;
}

interface ElementInfo {
  /** The DOM element */
  element: HTMLElement;
  /** React component info if available */
  componentInfo: ComponentInfo | null;
  /** Element's bounding rect */
  rect: DOMRect;
  /** Generated CSS selector */
  selector?: string;
}

interface HighlightStyle {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface TooltipStyle {
  left: number;
  top: number;
}
```

### Return Value

```typescript
interface UseElementSelectionReturn {
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

  /** Full element info for hovered element */
  hoveredElementInfo: ElementInfo | null;

  /** Style for highlight overlay */
  highlightStyle: HighlightStyle | null;

  /** Style for tooltip positioning */
  tooltipStyle: TooltipStyle | null;

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
```

## Usage

### Basic Element Selection

```tsx
import { useElementSelection } from 'react-visual-feedback';

function ElementPicker() {
  const {
    isEnabled,
    enable,
    disable,
    hoveredElement,
    selectedElement,
    highlightStyle,
    hoveredComponentInfo,
  } = useElementSelection({
    onElementSelect: (info) => {
      console.log('Selected:', info.selector);
      console.log('Component:', info.componentInfo?.name);
    },
  });

  return (
    <div>
      <button onClick={isEnabled ? disable : enable}>
        {isEnabled ? 'Stop Selecting' : 'Select Element'}
      </button>

      {isEnabled && highlightStyle && (
        <div
          className="element-highlight"
          style={{
            position: 'fixed',
            border: '2px solid #4A90D9',
            backgroundColor: 'rgba(74, 144, 217, 0.1)',
            pointerEvents: 'none',
            zIndex: 10000,
            left: highlightStyle.left,
            top: highlightStyle.top,
            width: highlightStyle.width,
            height: highlightStyle.height,
          }}
        />
      )}

      {isEnabled && hoveredComponentInfo && (
        <div className="tooltip">
          Component: {hoveredComponentInfo.name}
        </div>
      )}

      {selectedElement && (
        <p>Selected: {selectedElement.tagName.toLowerCase()}</p>
      )}
    </div>
  );
}
```

### With Component Info Tooltip

```tsx
import { useElementSelection } from 'react-visual-feedback';

function DeveloperInspector() {
  const {
    isEnabled,
    toggle,
    hoveredComponentInfo,
    highlightStyle,
    tooltipStyle,
  } = useElementSelection();

  return (
    <div>
      <button onClick={toggle}>
        {isEnabled ? 'Disable Inspector' : 'Enable Inspector'}
      </button>

      {isEnabled && highlightStyle && (
        <>
          {/* Highlight overlay */}
          <div
            style={{
              position: 'fixed',
              border: '2px dashed #ff6b6b',
              pointerEvents: 'none',
              zIndex: 9999,
              ...highlightStyle,
            }}
          />

          {/* Component tooltip */}
          {tooltipStyle && hoveredComponentInfo && (
            <div
              style={{
                position: 'fixed',
                left: tooltipStyle.left,
                top: tooltipStyle.top,
                background: '#333',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                zIndex: 10000,
              }}
            >
              <strong>{hoveredComponentInfo.name}</strong>
              {hoveredComponentInfo.filePath && (
                <div style={{ opacity: 0.7, fontSize: '10px' }}>
                  {hoveredComponentInfo.filePath}
                  {hoveredComponentInfo.lineNumber && `:${hoveredComponentInfo.lineNumber}`}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

### Scoped Selection

```tsx
import { useRef } from 'react';
import { useElementSelection } from 'react-visual-feedback';

function ScopedPicker() {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    isEnabled,
    enable,
    selectedElement,
    highlightStyle,
  } = useElementSelection({
    containerRef, // Only select elements within this container
    excludeSelector: '.ignore-selection, [data-no-select]',
  });

  return (
    <div>
      <button onClick={enable}>Select Element</button>

      <div ref={containerRef} className="selection-area">
        <div className="selectable">Can be selected</div>
        <div className="ignore-selection">Cannot be selected</div>
        <div data-no-select>Also excluded</div>
      </div>

      {isEnabled && highlightStyle && (
        <div className="highlight" style={highlightStyle} />
      )}
    </div>
  );
}
```

### With Screenshot Capture

```tsx
import { useElementSelection, useScreenCapture } from 'react-visual-feedback';

function CaptureSelectedElement() {
  const { captureArea, screenshot } = useScreenCapture();

  const {
    isEnabled,
    enable,
    disable,
    selectedElement,
    highlightStyle,
  } = useElementSelection({
    onElementSelect: async (info) => {
      // Capture the selected element
      await captureArea(info.rect);
      disable();
    },
  });

  return (
    <div>
      <button onClick={enable} disabled={isEnabled}>
        Click Element to Capture
      </button>

      {isEnabled && highlightStyle && (
        <div
          className="capture-highlight"
          style={{
            position: 'fixed',
            border: '3px solid green',
            ...highlightStyle,
          }}
        />
      )}

      {screenshot && (
        <img src={screenshot} alt="Captured element" />
      )}
    </div>
  );
}
```

### Exclude Feedback UI

```tsx
import { useElementSelection } from 'react-visual-feedback';

function FeedbackElementPicker() {
  const selection = useElementSelection({
    // Exclude the feedback widget itself from selection
    excludeSelector: '[data-feedback-ui], .feedback-overlay, #feedback-container',
    onElementSelect: (info) => {
      attachFeedbackToElement(info.element);
    },
  });

  return (
    <div id="feedback-container" data-feedback-ui>
      {/* This UI won't be selectable */}
      <button onClick={selection.enable}>Pick Element</button>
    </div>
  );
}
```

## Testing

```tsx
import { renderHook, act } from '@testing-library/react';
import { useElementSelection } from 'react-visual-feedback';

describe('useElementSelection', () => {
  test('starts disabled by default', () => {
    const { result } = renderHook(() => useElementSelection());
    expect(result.current.isEnabled).toBe(false);
    expect(result.current.hoveredElement).toBeNull();
    expect(result.current.selectedElement).toBeNull();
  });

  test('respects enabled option', () => {
    const { result } = renderHook(() =>
      useElementSelection({ enabled: true })
    );
    expect(result.current.isEnabled).toBe(true);
  });

  test('enable and disable', () => {
    const { result } = renderHook(() => useElementSelection());

    act(() => {
      result.current.enable();
    });
    expect(result.current.isEnabled).toBe(true);

    act(() => {
      result.current.disable();
    });
    expect(result.current.isEnabled).toBe(false);
  });

  test('toggle', () => {
    const { result } = renderHook(() => useElementSelection());

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isEnabled).toBe(true);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isEnabled).toBe(false);
  });

  test('clearSelection resets selected element', () => {
    const { result } = renderHook(() => useElementSelection());

    // Simulate selection (would normally happen via mouse events)
    // In real tests, you'd use userEvent to click elements

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedElement).toBeNull();
  });
});
```

---

*Documentation compiled by GitHub Copilot*
*For project: react-visual-feedback*
