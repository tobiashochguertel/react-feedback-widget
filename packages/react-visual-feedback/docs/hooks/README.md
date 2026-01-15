# Hooks API Reference

> **Updated:** 2026-01-16
> **Related:** [Architecture Overview](../architecture/README.md)

This package provides a comprehensive set of React hooks following the Interface Segregation Principle. Each hook has a focused, single-responsibility API.

## Quick Navigation

| Hook | Purpose | Documentation |
|------|---------|---------------|
| `useActivation` | Toggle feedback widget activation | [useActivation.md](./useActivation.md) |
| `useDashboard` | Manage dashboard visibility | [useDashboard.md](./useDashboard.md) |
| `useRecording` | Control screen recording | [useRecording.md](./useRecording.md) |
| `useScreenCapture` | Capture screenshots | [useScreenCapture.md](./useScreenCapture.md) |
| `useElementSelection` | Select/highlight DOM elements | [useElementSelection.md](./useElementSelection.md) |
| `useKeyboardShortcuts` | Register keyboard shortcuts | [useKeyboardShortcuts.md](./useKeyboardShortcuts.md) |
| `useFeedbackSubmission` | Queue and submit feedback | [useFeedbackSubmission.md](./useFeedbackSubmission.md) |
| `useIntegrations` | Manage Jira/Sheets integrations | [useIntegrations.md](./useIntegrations.md) |
| `useTheme` | Access theme colors and mode | [useTheme.md](./useTheme.md) |

## Installation

All hooks are exported from the main package:

```typescript
import {
  useActivation,
  useDashboard,
  useRecording,
  useScreenCapture,
  useElementSelection,
  useKeyboardShortcuts,
  useFeedbackSubmission,
  useIntegrations,
  useTheme,
  useColors,
  useFeedbackTheme,
} from 'react-visual-feedback';
```

## Controlled vs Uncontrolled Patterns

Most hooks support both **controlled** and **uncontrolled** modes:

### Uncontrolled Mode (Default)

State is managed internally by the hook:

```tsx
function MyComponent() {
  const { isActive, toggle } = useActivation({ defaultOpen: false });

  return <button onClick={toggle}>{isActive ? 'Active' : 'Inactive'}</button>;
}
```

### Controlled Mode

State is managed externally:

```tsx
function MyComponent() {
  const [isActive, setIsActive] = useState(false);

  const activation = useActivation({
    controlledIsActive: isActive,
    onActiveChange: setIsActive,
  });

  return <button onClick={activation.toggle}>Toggle</button>;
}
```

## Common Patterns

### Combining Hooks

```tsx
import {
  useActivation,
  useRecording,
  useScreenCapture,
  useKeyboardShortcuts,
} from 'react-visual-feedback';

function FeedbackController() {
  const { isActive, activate, deactivate } = useActivation();
  const { isRecording, startRecording, stopRecording } = useRecording();
  const { captureScreen, screenshot } = useScreenCapture();

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      { id: 'toggle', key: 'F2', action: isActive ? deactivate : activate },
      { id: 'screenshot', key: 'p', modifiers: ['ctrl'], action: captureScreen },
      { id: 'record', key: 'r', modifiers: ['ctrl'], action: isRecording ? stopRecording : startRecording },
    ],
  });

  return (/* ... */);
}
```

### Using with FeedbackProvider

All hooks are designed to work with `FeedbackProvider`:

```tsx
import { FeedbackProvider, useActivation } from 'react-visual-feedback';

function App() {
  return (
    <FeedbackProvider>
      <FeedbackButton />
    </FeedbackProvider>
  );
}

function FeedbackButton() {
  const { isActive, toggle } = useActivation();

  return (
    <button onClick={toggle}>
      {isActive ? 'Close Feedback' : 'Give Feedback'}
    </button>
  );
}
```

## Hook Categories

### State Management Hooks

These hooks manage boolean state with controlled/uncontrolled patterns:

- **useActivation** — Feedback widget activation state
- **useDashboard** — Dashboard visibility state

### Feature Hooks

These hooks provide functionality for specific features:

- **useRecording** — Screen recording with pause/resume
- **useScreenCapture** — Screenshot capture and cropping
- **useElementSelection** — DOM element highlighting and selection

### Utility Hooks

These hooks provide support functionality:

- **useKeyboardShortcuts** — Global keyboard shortcut registration
- **useFeedbackSubmission** — Feedback queue with retry logic
- **useIntegrations** — Third-party integration management

### Theme Hooks

These hooks provide theme access:

- **useTheme** — Full theme object and utilities
- **useColors** — Direct access to color values
- **useFeedbackTheme** — Extended theme utilities

## Type Exports

All hook types are exported for TypeScript users:

```typescript
import type {
  UseActivationOptions,
  UseActivationReturn,
  UseDashboardOptions,
  UseDashboardReturn,
  UseRecordingOptions,
  UseRecordingReturn,
  UseScreenCaptureOptions,
  UseScreenCaptureReturn,
  UseElementSelectionOptions,
  UseElementSelectionReturn,
  UseKeyboardShortcutsOptions,
  UseKeyboardShortcutsReturn,
  UseFeedbackSubmissionOptions,
  UseFeedbackSubmissionReturn,
  UseIntegrationsOptions,
  UseIntegrationsReturn,
  UseThemeResult,
  UseColorsResult,
  UseFeedbackThemeResult,
} from 'react-visual-feedback';
```

## Testing

All hooks work with standard React Testing Library:

```tsx
import { renderHook, act } from '@testing-library/react';
import { useActivation } from 'react-visual-feedback';

test('activation hook toggles state', () => {
  const { result } = renderHook(() => useActivation());

  expect(result.current.isActive).toBe(false);

  act(() => {
    result.current.toggle();
  });

  expect(result.current.isActive).toBe(true);
});
```

For hooks that use services, provide mock services via `FeedbackProvider`:

```tsx
import { MockRecorderService, MockScreenshotService } from 'react-visual-feedback';

const wrapper = ({ children }) => (
  <FeedbackProvider
    services={{
      recorder: new MockRecorderService(),
      screenshot: new MockScreenshotService(),
    }}
  >
    {children}
  </FeedbackProvider>
);

test('recording hook starts recording', async () => {
  const { result } = renderHook(() => useRecording(), { wrapper });

  await act(async () => {
    await result.current.startRecording();
  });

  expect(result.current.isRecording).toBe(true);
});
```

---

*Documentation compiled by GitHub Copilot*
*For project: react-visual-feedback*
