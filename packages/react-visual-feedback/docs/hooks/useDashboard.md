# useDashboard

> **Updated:** 2026-01-16  
> **Related:** [Hooks Overview](./README.md)

## Purpose

Manages dashboard visibility state. Supports both controlled and uncontrolled modes.

## Import

```typescript
import { useDashboard } from 'react-visual-feedback';
import type { UseDashboardOptions, UseDashboardReturn } from 'react-visual-feedback';
```

## API

### Options

```typescript
interface UseDashboardOptions {
  /** Controlled open state */
  controlledIsOpen?: boolean;
  
  /** Callback when open state changes (required for controlled mode) */
  onOpenChange?: (isOpen: boolean) => void;
  
  /** Initial state for uncontrolled mode (default: false) */
  defaultOpen?: boolean;
}
```

### Return Value

```typescript
interface UseDashboardReturn {
  /** Whether the dashboard is currently open */
  isOpen: boolean;
  
  /** Set open state */
  setIsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  
  /** Open the dashboard */
  open: () => void;
  
  /** Close the dashboard */
  close: () => void;
  
  /** Toggle the dashboard */
  toggle: () => void;
  
  /** Whether using controlled mode */
  isControlled: boolean;
}
```

## Usage

### Uncontrolled Mode

```tsx
import { useDashboard } from 'react-visual-feedback';

function DashboardController() {
  const { isOpen, open, close, toggle } = useDashboard({
    defaultOpen: false,
  });

  return (
    <div>
      <button onClick={open}>View Dashboard</button>
      
      {isOpen && (
        <div className="dashboard-modal">
          <h2>Feedback Dashboard</h2>
          <button onClick={close}>Close</button>
          {/* Dashboard content */}
        </div>
      )}
    </div>
  );
}
```

### Controlled Mode

```tsx
import { useState } from 'react';
import { useDashboard } from 'react-visual-feedback';

function DashboardWithState() {
  const [isOpen, setIsOpen] = useState(false);
  
  const dashboard = useDashboard({
    controlledIsOpen: isOpen,
    onOpenChange: setIsOpen,
  });

  // Track open/close for analytics
  const handleOpenChange = (open: boolean) => {
    if (open) {
      analytics.track('dashboard_opened');
    } else {
      analytics.track('dashboard_closed');
    }
    setIsOpen(open);
  };

  return (
    <button onClick={dashboard.toggle}>
      {dashboard.isOpen ? 'Close' : 'Open'} Dashboard
    </button>
  );
}
```

### With Keyboard Shortcut

```tsx
import { useDashboard, useKeyboardShortcuts } from 'react-visual-feedback';

function DashboardWithShortcut() {
  const { isOpen, open, close, toggle } = useDashboard();

  useKeyboardShortcuts({
    shortcuts: [
      {
        id: 'toggle-dashboard',
        key: 'd',
        modifiers: ['ctrl', 'shift'],
        action: toggle,
        description: 'Toggle feedback dashboard',
      },
      {
        id: 'close-dashboard',
        key: 'Escape',
        action: close,
        enabled: isOpen, // Only active when dashboard is open
        description: 'Close dashboard',
      },
    ],
  });

  return (
    <div>
      <p>Press Ctrl+Shift+D to toggle dashboard</p>
      {isOpen && <Dashboard onClose={close} />}
    </div>
  );
}
```

### Dashboard with Feedback List

```tsx
import { useDashboard, useActivation } from 'react-visual-feedback';

function FeedbackManager() {
  const activation = useActivation();
  const dashboard = useDashboard();

  const handleNewFeedback = () => {
    dashboard.close();
    activation.activate();
  };

  return (
    <div>
      {!activation.isActive && (
        <div>
          <button onClick={dashboard.open}>View All Feedback</button>
          <button onClick={activation.activate}>New Feedback</button>
        </div>
      )}

      {dashboard.isOpen && (
        <FeedbackDashboard 
          onClose={dashboard.close}
          onNewFeedback={handleNewFeedback}
        />
      )}
    </div>
  );
}
```

## Testing

```tsx
import { renderHook, act } from '@testing-library/react';
import { useDashboard } from 'react-visual-feedback';

describe('useDashboard', () => {
  test('starts closed by default', () => {
    const { result } = renderHook(() => useDashboard());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.isControlled).toBe(false);
  });

  test('respects defaultOpen option', () => {
    const { result } = renderHook(() => 
      useDashboard({ defaultOpen: true })
    );
    expect(result.current.isOpen).toBe(true);
  });

  test('open and close methods work', () => {
    const { result } = renderHook(() => useDashboard());
    
    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);
    
    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
  });

  test('toggle toggles state', () => {
    const { result } = renderHook(() => useDashboard());
    
    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(true);
    
    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(false);
  });

  test('controlled mode calls onOpenChange', () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() =>
      useDashboard({
        controlledIsOpen: false,
        onOpenChange,
      })
    );

    expect(result.current.isControlled).toBe(true);
    
    act(() => {
      result.current.open();
    });
    
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});
```

---

*Documentation compiled by GitHub Copilot*  
*For project: react-visual-feedback*
