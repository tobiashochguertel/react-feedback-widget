# useKeyboardShortcuts

> **Updated:** 2026-01-16
> **Related:** [Hooks Overview](./README.md), [Keyboard Shortcuts Feature](../features/keyboard-shortcuts.md)

## Purpose

Manages keyboard shortcuts with configurable key bindings and modifier key support.

## Import

```typescript
import { useKeyboardShortcuts, formatShortcut } from 'react-visual-feedback';
import type {
  UseKeyboardShortcutsOptions,
  UseKeyboardShortcutsReturn,
  KeyboardShortcut,
  ModifierKey,
} from 'react-visual-feedback';
```

## API

### Types

```typescript
type ModifierKey = 'ctrl' | 'shift' | 'alt' | 'meta';

interface KeyboardShortcut {
  /** Unique identifier */
  id: string;
  /** Key to listen for (e.g., 'Escape', 'Enter', 'a', 'F1') */
  key: string;
  /** Modifier keys that must be held */
  modifiers?: ModifierKey[];
  /** Action to execute */
  action: () => void;
  /** Whether this shortcut is enabled (default: true) */
  enabled?: boolean;
  /** Description for help UI */
  description?: string;
}
```

### Options

```typescript
interface UseKeyboardShortcutsOptions {
  /** Initial shortcut definitions */
  shortcuts?: KeyboardShortcut[];

  /** Whether keyboard handling is enabled globally */
  enabled?: boolean;

  /** Callback when any shortcut is triggered */
  onShortcutTriggered?: (shortcutId: string) => void;

  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;

  /** Whether to stop event propagation */
  stopPropagation?: boolean;

  /** Element to attach listeners to (defaults to document) */
  targetRef?: React.RefObject<HTMLElement | null>;
}
```

### Return Value

```typescript
interface UseKeyboardShortcutsReturn {
  /** Whether keyboard handling is enabled */
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

  /** Enable a specific shortcut */
  enableShortcut: (id: string) => void;

  /** Disable a specific shortcut */
  disableShortcut: (id: string) => void;

  /** Get a shortcut by ID */
  getShortcut: (id: string) => KeyboardShortcut | undefined;

  /** Check if a shortcut is registered */
  hasShortcut: (id: string) => boolean;

  /** Clear all shortcuts */
  clearShortcuts: () => void;
}
```

### Utility Function

```typescript
/**
 * Format a shortcut for display
 * @example
 * formatShortcut({ id: 'save', key: 's', modifiers: ['ctrl'] })
 * // Returns "Ctrl+S" on Windows, "⌃S" on Mac
 */
function formatShortcut(shortcut: KeyboardShortcut): string;
```

## Usage

### Basic Shortcuts

```tsx
import { useKeyboardShortcuts } from 'react-visual-feedback';

function App() {
  useKeyboardShortcuts({
    shortcuts: [
      {
        id: 'save',
        key: 's',
        modifiers: ['ctrl'],
        action: () => saveDocument(),
        description: 'Save document',
      },
      {
        id: 'escape',
        key: 'Escape',
        action: () => closeModal(),
        description: 'Close modal',
      },
    ],
    preventDefault: true,
  });

  return <div>Press Ctrl+S to save</div>;
}
```

### Dynamic Shortcuts

```tsx
import { useKeyboardShortcuts } from 'react-visual-feedback';

function DynamicShortcuts() {
  const { registerShortcut, unregisterShortcut, shortcuts } = useKeyboardShortcuts();

  const addUndoShortcut = () => {
    registerShortcut({
      id: 'undo',
      key: 'z',
      modifiers: ['ctrl'],
      action: () => undo(),
      description: 'Undo last action',
    });
  };

  const removeUndoShortcut = () => {
    unregisterShortcut('undo');
  };

  return (
    <div>
      <button onClick={addUndoShortcut}>Add Undo Shortcut</button>
      <button onClick={removeUndoShortcut}>Remove Undo Shortcut</button>
      <p>Active shortcuts: {shortcuts.length}</p>
    </div>
  );
}
```

### Conditional Shortcuts

```tsx
import { useKeyboardShortcuts } from 'react-visual-feedback';

function ModalWithShortcuts({ isOpen, onClose, onConfirm }) {
  useKeyboardShortcuts({
    shortcuts: [
      {
        id: 'close',
        key: 'Escape',
        action: onClose,
        enabled: isOpen, // Only active when modal is open
      },
      {
        id: 'confirm',
        key: 'Enter',
        modifiers: ['ctrl'],
        action: onConfirm,
        enabled: isOpen,
      },
    ],
  });

  if (!isOpen) return null;

  return (
    <div className="modal">
      <p>Press Escape to close or Ctrl+Enter to confirm</p>
    </div>
  );
}
```

### Shortcut Help Dialog

```tsx
import { useKeyboardShortcuts, formatShortcut } from 'react-visual-feedback';

function ShortcutHelp() {
  const [showHelp, setShowHelp] = useState(false);

  const { shortcuts } = useKeyboardShortcuts({
    shortcuts: [
      {
        id: 'help',
        key: '?',
        modifiers: ['shift'],
        action: () => setShowHelp(true),
        description: 'Show keyboard shortcuts',
      },
      // ... other shortcuts
    ],
  });

  return (
    <div>
      <button onClick={() => setShowHelp(true)}>Keyboard Shortcuts</button>

      {showHelp && (
        <div className="help-dialog">
          <h2>Keyboard Shortcuts</h2>
          <table>
            <thead>
              <tr>
                <th>Shortcut</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {shortcuts
                .filter(s => s.enabled !== false)
                .map(shortcut => (
                  <tr key={shortcut.id}>
                    <td><code>{formatShortcut(shortcut)}</code></td>
                    <td>{shortcut.description}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
          <button onClick={() => setShowHelp(false)}>Close</button>
        </div>
      )}
    </div>
  );
}
```

### With Feedback Widget

```tsx
import {
  useActivation,
  useDashboard,
  useRecording,
  useKeyboardShortcuts,
} from 'react-visual-feedback';

function FeedbackShortcuts() {
  const activation = useActivation();
  const dashboard = useDashboard();
  const recording = useRecording();

  useKeyboardShortcuts({
    shortcuts: [
      {
        id: 'toggle-feedback',
        key: 'F2',
        action: activation.toggle,
        description: 'Toggle feedback mode',
      },
      {
        id: 'open-dashboard',
        key: 'd',
        modifiers: ['ctrl', 'shift'],
        action: dashboard.toggle,
        description: 'Open feedback dashboard',
      },
      {
        id: 'toggle-recording',
        key: 'r',
        modifiers: ['ctrl', 'shift'],
        action: () => {
          if (recording.isRecording) {
            recording.stopRecording();
          } else {
            recording.startRecording();
          }
        },
        description: 'Start/stop screen recording',
      },
      {
        id: 'close',
        key: 'Escape',
        action: () => {
          if (recording.isRecording) {
            recording.cancelRecording();
          } else if (activation.isActive) {
            activation.deactivate();
          }
        },
        description: 'Cancel/close',
      },
    ],
    preventDefault: true,
  });

  return null; // Just manages shortcuts
}
```

### Scoped to Element

```tsx
import { useRef } from 'react';
import { useKeyboardShortcuts } from 'react-visual-feedback';

function Editor() {
  const editorRef = useRef<HTMLDivElement>(null);

  useKeyboardShortcuts({
    targetRef: editorRef, // Only listen when editor is focused
    shortcuts: [
      {
        id: 'bold',
        key: 'b',
        modifiers: ['ctrl'],
        action: () => toggleBold(),
      },
      {
        id: 'italic',
        key: 'i',
        modifiers: ['ctrl'],
        action: () => toggleItalic(),
      },
    ],
    preventDefault: true,
  });

  return (
    <div ref={editorRef} tabIndex={0} className="editor">
      <p>Click here and use Ctrl+B for bold, Ctrl+I for italic</p>
    </div>
  );
}
```

### With Analytics

```tsx
import { useKeyboardShortcuts } from 'react-visual-feedback';

function TrackedShortcuts() {
  useKeyboardShortcuts({
    shortcuts: [
      { id: 'save', key: 's', modifiers: ['ctrl'], action: save },
      { id: 'undo', key: 'z', modifiers: ['ctrl'], action: undo },
    ],
    onShortcutTriggered: (shortcutId) => {
      analytics.track('keyboard_shortcut_used', {
        shortcut_id: shortcutId,
        timestamp: new Date().toISOString(),
      });
    },
  });

  return <div>Shortcuts are tracked</div>;
}
```

## Testing

```tsx
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts, formatShortcut } from 'react-visual-feedback';

describe('useKeyboardShortcuts', () => {
  test('starts enabled by default', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    expect(result.current.isEnabled).toBe(true);
  });

  test('registers initial shortcuts', () => {
    const action = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [{ id: 'test', key: 'a', action }],
      })
    );

    expect(result.current.shortcuts).toHaveLength(1);
    expect(result.current.hasShortcut('test')).toBe(true);
  });

  test('registerShortcut adds shortcut', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());

    act(() => {
      result.current.registerShortcut({
        id: 'new',
        key: 'n',
        action: vi.fn(),
      });
    });

    expect(result.current.hasShortcut('new')).toBe(true);
  });

  test('unregisterShortcut removes shortcut', () => {
    const { result } = renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [{ id: 'test', key: 'a', action: vi.fn() }],
      })
    );

    act(() => {
      result.current.unregisterShortcut('test');
    });

    expect(result.current.hasShortcut('test')).toBe(false);
  });

  test('disable and enable work', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());

    act(() => {
      result.current.disable();
    });
    expect(result.current.isEnabled).toBe(false);

    act(() => {
      result.current.enable();
    });
    expect(result.current.isEnabled).toBe(true);
  });
});

describe('formatShortcut', () => {
  test('formats simple key', () => {
    expect(formatShortcut({ id: 'esc', key: 'Escape', action: vi.fn() }))
      .toBe('Escape');
  });

  test('formats with modifiers', () => {
    const formatted = formatShortcut({
      id: 'save',
      key: 's',
      modifiers: ['ctrl'],
      action: vi.fn(),
    });
    // Platform dependent: "Ctrl+S" or "⌃S"
    expect(formatted).toMatch(/Ctrl\+S|⌃S/);
  });
});
```

---

*Documentation compiled by GitHub Copilot*
*For project: react-visual-feedback*
