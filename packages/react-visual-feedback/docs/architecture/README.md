# React Visual Feedback Architecture

> **Updated:** 2026-01-16
> **Version:** 1.0.0
> **Status:** Complete (all 43/48 code tasks done)

## Overview

React Visual Feedback is a comprehensive React library for collecting visual feedback with screenshot annotation, screen recording, and integration support. The architecture follows modern React patterns with a focus on:

- **Separation of Concerns** — Each module has a single responsibility
- **Dependency Injection** — Services are injectable for testability
- **State Machine** — XState for explicit state transitions
- **Interface Segregation** — Focused hooks for specific functionality

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ FeedbackProvider│  │FeedbackModal │  │FeedbackDashboard│   │
│  └───────┬───────┘  └──────┬───────┘  └────────┬────────┘   │
│          │                  │                   │             │
│  ┌───────┴──────────────────┴───────────────────┴──────┐     │
│  │                    Hooks Layer                        │     │
│  │  useActivation, useDashboard, useRecording, etc.     │     │
│  └───────────────────────────┬──────────────────────────┘     │
│                              │                                │
│  ┌───────────────────────────┴──────────────────────────┐     │
│  │                    State Layer (XState)               │     │
│  │  feedbackMachine, selectors, actions                  │     │
│  └───────────────────────────┬──────────────────────────┘     │
│                              │                                │
│  ┌───────────────────────────┴──────────────────────────┐     │
│  │                   Services Layer                      │     │
│  │  StorageService, RecorderService, ScreenshotService   │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐     │
│  │                  Integrations Layer                    │     │
│  │  JiraIntegration, SheetsIntegration, Custom            │     │
│  └───────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Architecture Documents

| Document                                        | Description                                        |
| ----------------------------------------------- | -------------------------------------------------- |
| [Directory Structure](./directory-structure.md) | Complete directory layout with module descriptions |
| [Component Hierarchy](./component-hierarchy.md) | Component relationships and data flow              |
| [Data Flow](./data-flow.md)                     | State management and data flow patterns            |

## Design Patterns Used

### 1. Dependency Injection

Services are injected into the FeedbackProvider, allowing easy testing and customization:

```tsx
import { FeedbackProvider, createTestServices } from "react-visual-feedback";

// Production (default services)
<FeedbackProvider>{children}</FeedbackProvider>;

// Testing (mock services)
const testServices = createTestServicesSync();
<FeedbackProvider services={testServices}>{children}</FeedbackProvider>;
```

### 2. Factory Pattern

Integration creation uses factories for extensibility:

```typescript
const factory = new IntegrationFactory();
factory.register(JiraIntegration, jiraMetadata);
factory.register(SheetsIntegration, sheetsMetadata);

const jira = factory.create("jira", config);
```

### 3. State Machine (XState)

Complex state transitions are handled by XState v5:

```typescript
// States: idle → hovering → capturing → modal → submitting
import { feedbackMachine } from './state/feedbackMachine';

// 23 events mapped to explicit state transitions
type FeedbackEvent =
  | { type: 'START_HOVERING'; payload: {...} }
  | { type: 'STOP_HOVERING' }
  | { type: 'START_CAPTURE'; payload: HTMLElement }
  // ... etc
```

### 4. Strategy Pattern

Integrations implement a common interface:

```typescript
interface Integration<TConfig, TResult> {
  readonly type: IntegrationType;
  isConfigured(): boolean;
  validateConfig(config: TConfig): ValidationResult;
  submit(data: FeedbackData): Promise<TResult>;
  getConfigModal(): React.ComponentType<ConfigModalProps>;
}
```

### 5. Registry Pattern

Status management uses a central registry:

```typescript
import { defaultStatusRegistry, StatusRegistry } from "react-visual-feedback";

// Normalize status strings
const status = defaultStatusRegistry.normalize("bug"); // → 'open'

// Register custom status
defaultStatusRegistry.registerStatus("custom-status", {
  label: "Custom",
  color: "#ff00ff",
  icon: "star",
});
```

## Key Modules

### Core Components

| Component           | Purpose                                     | Lines |
| ------------------- | ------------------------------------------- | ----- |
| `FeedbackProvider`  | Context provider, state machine integration | ~685  |
| `FeedbackModal`     | Feedback submission form with annotations   | ~450  |
| `FeedbackDashboard` | Feedback management dashboard               | ~695  |
| `FeedbackTrigger`   | Floating action button for activation       | ~200  |

### Services (`src/services/`)

| Service       | Interface             | Production                     | Test                          |
| ------------- | --------------------- | ------------------------------ | ----------------------------- |
| Storage       | `StorageService`      | `LocalStorageService`          | `InMemoryStorageService`      |
| Video Storage | `VideoStorageService` | `IndexedDBVideoStorageService` | `InMemoryVideoStorageService` |
| Recording     | `RecorderService`     | `MediaRecorderService`         | `MockRecorderService`         |
| Screenshot    | `ScreenshotService`   | `ModernScreenshotService`      | `MockScreenshotService`       |

### Hooks (`src/hooks/`)

| Hook                    | Purpose                         |
| ----------------------- | ------------------------------- |
| `useActivation`         | Manage feedback mode activation |
| `useDashboard`          | Dashboard state and operations  |
| `useRecording`          | Video recording functionality   |
| `useScreenCapture`      | Screenshot capture              |
| `useElementSelection`   | Element selection and hover     |
| `useKeyboardShortcuts`  | Keyboard shortcut handling      |
| `useFeedbackSubmission` | Feedback submission             |
| `useIntegrations`       | Integration management          |
| `useTheme`              | Theme access and utilities      |

### State (`src/state/`)

| Module               | Purpose                                |
| -------------------- | -------------------------------------- |
| `feedbackMachine.ts` | XState v5 state machine (533 lines)    |
| `feedbackReducer.ts` | Legacy reducer (for migration support) |
| `actions.ts`         | 23 type-safe action creators           |
| `selectors.ts`       | 35+ state selectors                    |

## Technology Stack

- **React 18+** — UI framework
- **XState v5** — State machine management
- **styled-components** — CSS-in-JS styling
- **TypeScript** — Type safety
- **Vitest** — Testing framework
- **Rollup** — Build bundler

## Related Documentation

- [Services Documentation](../services/README.md)
- [Hooks API Reference](../hooks/README.md)
- [Integration Guide](../integrations/README.md)
- [Quick Start](../getting-started/quick-start.md)

---

_Architecture documentation compiled by GitHub Copilot_
_For project: react-visual-feedback_
