# Directory Structure

> **Updated:** 2026-01-16
> **Related:** [Architecture Overview](./README.md)

## Overview

The React Visual Feedback package follows a modular directory structure that separates concerns and promotes maintainability.

```
src/
├── index.ts                    # Main entry point with all exports
├── FeedbackProvider.tsx        # Main context provider
├── FeedbackProvider.styles.ts  # Styled components for provider
├── FeedbackModal.tsx           # Feedback submission modal
├── FeedbackDashboard.tsx       # Dashboard for viewing feedback
├── FeedbackTrigger.tsx         # FAB trigger button
├── CanvasOverlay.tsx           # Annotation canvas
├── RecordingOverlay.tsx        # Recording indicator
├── SessionReplay.tsx           # Video playback
├── SubmissionQueue.tsx         # Offline queue manager
├── UpdatesModal.tsx            # Changelog modal
├── ErrorToast.tsx              # Toast notifications
├── recorder.ts                 # Session recording logic
├── theme.ts                    # Theme definitions
├── utils.ts                    # Legacy utilities
├── styled.d.ts                 # Styled-components types
│
├── components/                 # UI Components
│   ├── index.ts               # Component barrel exports
│   ├── StatusBadge.tsx        # Status indicator badge
│   ├── StatusDropdown.tsx     # Status selection dropdown
│   ├── LogEntry.tsx           # Event log display
│   │
│   ├── Dashboard/             # Dashboard sub-components (I014-I019)
│   │   ├── index.ts
│   │   ├── DashboardContainer.tsx
│   │   ├── DashboardHeader.tsx
│   │   ├── DashboardHelpers.tsx
│   │   ├── DashboardStyled.ts
│   │   ├── FeedbackCard.tsx
│   │   ├── FeedbackList.tsx
│   │   └── VideoMode.tsx
│   │
│   ├── Modal/                 # Modal components (I025)
│   │   ├── index.ts
│   │   └── BaseModal.tsx
│   │
│   ├── Overlay/               # Overlay components (I029-I031)
│   │   ├── index.ts
│   │   ├── CanvasOverlayComponent.tsx
│   │   ├── HighlightRenderer.tsx
│   │   └── SelectionOverlay.tsx
│   │
│   ├── Status/                # Status components
│   │   └── index.ts
│   │
│   └── shared/                # Shared utilities
│       ├── index.ts
│       └── ErrorBoundary.tsx
│
├── constants/                  # Magic number/string elimination (I002)
│   ├── index.ts               # Barrel export
│   ├── keyboard.ts            # KEYBOARD_SHORTCUTS
│   ├── media.ts               # RECORDING constants
│   ├── status.ts              # STATUS_COLORS
│   ├── storage.ts             # STORAGE_KEYS
│   └── ui.ts                  # Z_INDEX, ANIMATION
│
├── hooks/                      # Custom hooks (T001-T008, I028)
│   ├── index.ts               # Barrel export
│   ├── useActivation.ts       # Activation state management
│   ├── useDashboard.ts        # Dashboard operations
│   ├── useElementSelection.ts # Element hover/selection
│   ├── useFeedbackSubmission.ts # Submission handling
│   ├── useIntegrations.ts     # Integration management
│   ├── useKeyboardShortcuts.ts # Keyboard shortcuts
│   ├── useRecording.ts        # Video recording
│   ├── useScreenCapture.ts    # Screenshot capture
│   └── useTheme.ts            # Theme utilities
│
├── integrations/               # External service integrations (I020-I024)
│   ├── index.ts               # Barrel export
│   ├── config.ts              # Integration configuration
│   ├── types.ts               # Integration interfaces
│   ├── IntegrationFactory.ts  # Factory pattern
│   ├── IntegrationRegistry.ts # Registry pattern
│   ├── jira.ts                # Legacy Jira (deprecated)
│   ├── sheets.ts              # Legacy Sheets (deprecated)
│   │
│   ├── jira/                  # Modular Jira integration
│   │   ├── index.ts
│   │   ├── jiraTypes.ts
│   │   ├── jiraValidation.ts
│   │   ├── JiraClient.ts
│   │   ├── JiraIntegration.ts
│   │   └── JiraConfigModal.tsx
│   │
│   ├── sheets/                # Modular Sheets integration
│   │   ├── index.ts
│   │   ├── sheetsTypes.ts
│   │   ├── sheetsValidation.ts
│   │   ├── SheetsClient.ts
│   │   └── SheetsIntegration.ts
│   │
│   └── server/                # Server-side handlers
│       └── index.ts
│
├── registry/                   # Status registry (I033)
│   ├── index.ts
│   └── statusRegistry.ts
│
├── services/                   # Service layer (I005-I009)
│   ├── index.ts               # Barrel export
│   ├── ServiceFactory.ts      # Factory for service creation
│   │
│   ├── storage/               # Storage services
│   │   ├── StorageService.ts       # Interface
│   │   ├── LocalStorageService.ts  # Production implementation
│   │   ├── InMemoryStorageService.ts # Test implementation
│   │   ├── VideoStorageService.ts  # Interface
│   │   ├── IndexedDBVideoStorageService.ts # Production
│   │   └── InMemoryVideoStorageService.ts  # Test
│   │
│   ├── recording/             # Recording services
│   │   ├── RecorderService.ts      # Interface
│   │   ├── MediaRecorderService.ts # Production
│   │   └── MockRecorderService.ts  # Test
│   │
│   └── screenshot/            # Screenshot services
│       ├── ScreenshotService.ts     # Interface
│       ├── ModernScreenshotService.ts # Production
│       └── MockScreenshotService.ts # Test
│
├── state/                      # State management (I010-I013)
│   ├── index.ts               # Barrel export
│   ├── feedbackMachine.ts     # XState v5 state machine
│   ├── feedbackReducer.ts     # Reducer function
│   ├── actions.ts             # Action creators
│   └── selectors.ts           # State selectors
│
├── theme/                      # Theme system
│   └── index.ts
│
├── types/                      # TypeScript types
│   └── index.ts               # All type definitions
│
└── utils/                      # Utility functions (I003)
    ├── index.ts               # Barrel export
    ├── dateUtils.ts           # Date formatting utilities
    ├── elementUtils.ts        # DOM element utilities
    └── validation.ts          # Form validation utilities
```

## Module Descriptions

### Core Components (`src/*.tsx`)

The main components that form the user-facing API:

| File                         | Description                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| `FeedbackProvider.tsx`       | React context provider that wraps the application and provides feedback functionality to all children |
| `FeedbackProvider.styles.ts` | Extracted styled components for the provider's overlay UI                                             |
| `FeedbackModal.tsx`          | Modal dialog for composing and submitting feedback with annotation tools                              |
| `FeedbackDashboard.tsx`      | Dashboard for viewing, filtering, and managing submitted feedback                                     |
| `FeedbackTrigger.tsx`        | Customizable floating action button for triggering feedback mode                                      |
| `CanvasOverlay.tsx`          | Canvas layer for drawing annotations on screenshots                                                   |
| `RecordingOverlay.tsx`       | Visual indicator shown during screen recording                                                        |
| `SessionReplay.tsx`          | Component for replaying recorded sessions with event timeline                                         |
| `SubmissionQueue.tsx`        | Manages offline feedback queue with retry logic                                                       |
| `UpdatesModal.tsx`           | Modal for displaying changelogs and release notes                                                     |
| `ErrorToast.tsx`             | Toast notification system for errors and messages                                                     |

### Components (`src/components/`)

Reusable UI components organized by function:

#### Dashboard Components (`components/Dashboard/`)

Extracted from `FeedbackDashboard.tsx` to reduce complexity:

- `DashboardContainer.tsx` — Main orchestrator
- `DashboardHeader.tsx` — Search and filter controls
- `FeedbackList.tsx` — List rendering with empty state
- `FeedbackCard.tsx` — Individual feedback card with details
- `VideoMode.tsx` — Fullscreen video with sync logs
- `DashboardStyled.ts` — 26 styled components

#### Modal Components (`components/Modal/`)

- `BaseModal.tsx` — Reusable modal with backdrop, animations, focus trap, ARIA support

#### Overlay Components (`components/Overlay/`)

- `CanvasOverlayComponent.tsx` — Canvas drawing logic
- `HighlightRenderer.tsx` — Element highlight rendering
- `SelectionOverlay.tsx` — Selection tooltip UI

#### Shared Components (`components/shared/`)

- `ErrorBoundary.tsx` — Error boundary with fallback UI and `withErrorBoundary` HOC

### Services (`src/services/`)

Abstraction layer over browser APIs for testability:

```typescript
// Interface pattern for dependency injection
interface StorageService {
  get(key: string): T | null;
  set(key: string, value: T): boolean;
  remove(key: string): boolean;
  has(key: string): boolean;
  clear(): boolean;
  keys(): string[];
}

// Production uses LocalStorageService
// Tests use InMemoryStorageService
```

### Hooks (`src/hooks/`)

Custom React hooks implementing the Interface Segregation Principle:

| Hook                    | Purpose              | Key Methods                                    |
| ----------------------- | -------------------- | ---------------------------------------------- |
| `useActivation`         | Toggle feedback mode | `isActive`, `toggle`, `activate`, `deactivate` |
| `useDashboard`          | Dashboard operations | `feedbackItems`, `filter`, `updateStatus`      |
| `useRecording`          | Video recording      | `start`, `stop`, `pause`, `resume`             |
| `useScreenCapture`      | Screenshots          | `capture`, `captureViewport`                   |
| `useElementSelection`   | Element hover        | `hoveredElement`, `selectElement`              |
| `useKeyboardShortcuts`  | Shortcuts            | `registerShortcut`, `unregisterShortcut`       |
| `useFeedbackSubmission` | Submit feedback      | `submit`, `queue`, `retry`                     |
| `useIntegrations`       | Manage integrations  | `submit`, `configure`, `status`                |
| `useTheme`              | Theme utilities      | `theme`, `colors`, `cssVar`                    |

### State (`src/state/`)

Centralized state management with XState:

| File                 | Description                                                     |
| -------------------- | --------------------------------------------------------------- |
| `feedbackMachine.ts` | XState v5 state machine with 23 events and explicit transitions |
| `feedbackReducer.ts` | Legacy reducer for migration support                            |
| `actions.ts`         | 23 type-safe action creators organized by category              |
| `selectors.ts`       | 35+ memoized selectors for state access                         |

### Integrations (`src/integrations/`)

External service connections:

| Module                   | Description                                                             |
| ------------------------ | ----------------------------------------------------------------------- |
| `types.ts`               | Core interfaces (`Integration`, `ValidationResult`, `SubmissionResult`) |
| `IntegrationFactory.ts`  | Factory for creating integration instances                              |
| `IntegrationRegistry.ts` | Registry for managing enabled integrations                              |
| `jira/`                  | Modular Jira integration (6 modules)                                    |
| `sheets/`                | Modular Sheets integration (5 modules)                                  |
| `server/`                | Server-side API handlers                                                |

### Registry (`src/registry/`)

Status management system:

```typescript
// Centralized status registry with normalization
const registry = new StatusRegistry();
registry.registerStatus("custom", { label: "Custom", color: "#ff00ff" });
const normalizedStatus = registry.normalize("feature"); // → 'open'
```

### Constants (`src/constants/`)

Eliminated magic numbers and strings:

| File          | Contents                                                        |
| ------------- | --------------------------------------------------------------- |
| `keyboard.ts` | `KEYBOARD_SHORTCUTS` — Ctrl+Shift+F to toggle, Escape to cancel |
| `media.ts`    | `MAX_VIDEO_SIZE_MB`, `VIDEO_MIME_TYPE`, `VIDEO_BITRATE`         |
| `status.ts`   | `STATUS_COLORS`, `DEFAULT_STATUSES`                             |
| `storage.ts`  | `STORAGE_KEYS.FEEDBACK_LIST`, `VIDEO_DB_NAME`                   |
| `ui.ts`       | `Z_INDEX.MODAL`, `ANIMATION.DURATION`, `TOOLTIP_OFFSET`         |

### Utils (`src/utils/`)

Shared utility functions:

| File              | Functions                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| `dateUtils.ts`    | `formatRelativeDate`, `formatTimestamp`, `formatDuration`, `formatTime`, `formatDate`, `formatShortDate` |
| `elementUtils.ts` | `getElementSelector`, `getElementInfo`, `getReactComponentInfo`                                          |
| `validation.ts`   | `required`, `email`, `url`, `validateField`, `validateForm`                                              |

## Documentation Structure

```
docs/
├── README.md                    # Documentation entry point
├── architecture/                # Architecture documentation
│   ├── README.md               # Overview (this document's parent)
│   ├── directory-structure.md  # This document
│   ├── component-hierarchy.md  # Component relationships
│   └── data-flow.md            # State and data flow
├── services/                    # Service layer documentation
├── hooks/                       # Hooks API reference
├── integrations/                # Integration guides
├── getting-started/             # Quick start guides
├── features/                    # Feature documentation
├── spec/                        # Task specifications
└── research/                    # Research documentation
```

---

_Documentation compiled by GitHub Copilot_
_For project: react-visual-feedback_
