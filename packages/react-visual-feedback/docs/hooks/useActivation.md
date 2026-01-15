# useActivation

> **Updated:** 2026-01-16
> **Related:** [Hooks Overview](./README.md)

## Purpose

Manages the activation state of the feedback widget. Supports both controlled and uncontrolled modes.

## Import

```typescript
import { useActivation } from 'react-visual-feedback';
import type { UseActivationOptions, UseActivationReturn } from 'react-visual-feedback';
```

## API

### Options

```typescript
interface UseActivationOptions {
  /** Controlled activation state */
  controlledIsActive?: boolean;

  /** Callback when activation state changes (required for controlled mode) */
  onActiveChange?: (active: boolean) => void;

  /** Initial state for uncontrolled mode (default: false) */
  defaultOpen?: boolean;
}
```

### Return Value

```typescript
interface UseActivationReturn {
  /** Current activation state */
  isActive: boolean;

  /** Set activation state */
  setIsActive: (active: boolean | ((prev: boolean) => boolean)) => void;

  /** Toggle activation state */
  toggle: () => void;

  /** Activate the feedback system */
  activate: () => void;

  /** Deactivate the feedback system */
  deactivate: () => void;

  /** Whether using controlled mode */
  isControlled: boolean;
}
```

## Usage

### Uncontrolled Mode

```tsx
import { useActivation } from 'react-visual-feedback';

function FeedbackButton() {
  const { isActive, toggle, activate, deactivate } = useActivation({
    defaultOpen: false,
  });

  return (
    <div>
      <button onClick={toggle}>
        {isActive ? 'Close Feedback' : 'Open Feedback'}
      </button>

      {isActive && (
        <div>
          <p>Feedback UI is active</p>
          <button onClick={deactivate}>Cancel</button>
        </div>
      )}
    </div>
  );
}
```

### Controlled Mode

```tsx
import { useState } from 'react';
import { useActivation } from 'react-visual-feedback';

function FeedbackController() {
  const [isActive, setIsActive] = useState(false);

  const activation = useActivation({
    controlledIsActive: isActive,
    onActiveChange: setIsActive,
  });

  // External control
  const handleExternalEvent = () => {
    setIsActive(true); // Or use activation.activate()
  };

  return (
    <div>
      <button onClick={activation.toggle}>Toggle</button>
      <button onClick={handleExternalEvent}>External Trigger</button>
      <span>Controlled: {activation.isControlled ? 'Yes' : 'No'}</span>
    </div>
  );
}
```

### With Keyboard Shortcut

```tsx
import { useActivation, useKeyboardShortcuts } from 'react-visual-feedback';

function FeedbackWithShortcut() {
  const { isActive, toggle } = useActivation();

  useKeyboardShortcuts({
    shortcuts: [
      {
        id: 'toggle-feedback',
        key: 'F2',
        action: toggle,
        description: 'Toggle feedback widget',
      },
    ],
  });

  return (
    <div>
      <p>Press F2 to toggle feedback</p>
      <p>Status: {isActive ? 'Active' : 'Inactive'}</p>
    </div>
  );
}
```

### Updater Function

The `setIsActive` function supports updater functions:

```tsx
const { setIsActive } = useActivation();

// Direct value
setIsActive(true);

// Updater function
setIsActive(prev => !prev);
```

## Testing

```tsx
import { renderHook, act } from '@testing-library/react';
import { useActivation } from 'react-visual-feedback';

describe('useActivation', () => {
  test('starts inactive by default', () => {
    const { result } = renderHook(() => useActivation());
    expect(result.current.isActive).toBe(false);
    expect(result.current.isControlled).toBe(false);
  });

  test('respects defaultOpen option', () => {
    const { result } = renderHook(() =>
      useActivation({ defaultOpen: true })
    );
    expect(result.current.isActive).toBe(true);
  });

  test('toggles state', () => {
    const { result } = renderHook(() => useActivation());

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isActive).toBe(true);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isActive).toBe(false);
  });

  test('activate and deactivate', () => {
    const { result } = renderHook(() => useActivation());

    act(() => {
      result.current.activate();
    });
    expect(result.current.isActive).toBe(true);

    act(() => {
      result.current.deactivate();
    });
    expect(result.current.isActive).toBe(false);
  });

  test('controlled mode calls onActiveChange', () => {
    const onActiveChange = vi.fn();
    const { result } = renderHook(() =>
      useActivation({
        controlledIsActive: false,
        onActiveChange,
      })
    );

    expect(result.current.isControlled).toBe(true);

    act(() => {
      result.current.toggle();
    });

    expect(onActiveChange).toHaveBeenCalledWith(true);
  });
});
```

---

*Documentation compiled by GitHub Copilot*
*For project: react-visual-feedback*
