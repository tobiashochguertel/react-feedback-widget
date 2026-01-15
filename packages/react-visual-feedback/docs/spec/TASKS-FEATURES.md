# React Visual Feedback - Feature Tasks

**Created:** 2026-01-15
**Updated:** 2026-01-15
**Parent Document:** [TASKS-OVERVIEW.md](./TASKS-OVERVIEW.md)

> This document contains detailed descriptions of all feature tasks (T###) for the react-visual-feedback architecture refactoring. Features represent new functionality - in this case, the extraction of custom hooks from the monolithic FeedbackProvider.

---

## Overview

The Feature tasks focus on **Custom Hooks Extraction** - splitting the massive FeedbackProvider (899 lines, 15+ useCallback hooks) into focused, single-responsibility hooks following the Interface Segregation Principle.

**Current Problem**: The `useFeedback` hook returns 10+ values, but most consumers only need 1-2 values.

**Goal**: Create focused hooks where each hook returns only what its specific consumers need.

---

## Features

### T001 - Create useActivation Hook

**Status**: ✅ Done
**Priority**: 🟢 High

**Description**:
Extract activation state management from FeedbackProvider into a dedicated `useActivation` hook. This hook manages whether the feedback capture mode is active or inactive, providing a focused interface for components that only need activation control.

**Implementation Notes**:

- Created `src/hooks/useActivation.ts` with full controlled/uncontrolled mode support
- Implemented toggle, activate, deactivate convenience methods
- Added isControlled flag for mode detection
- Support defaultOpen option for initial state
- Support onActiveChange callback for controlled mode
- Memoized return value and callbacks for performance
- Added comprehensive JSDoc documentation with examples
- Exported from hooks/index.ts
- 34 unit tests covering uncontrolled mode, controlled mode, callback stability, edge cases

**Current State**:
In FeedbackProvider.tsx (lines 351-370):

```typescript
const isControlled = controlledIsActive !== undefined;
const isActive = isControlled ? controlledIsActive : internalIsActive;

const setIsActive = useCallback((active: boolean | ((prev: boolean) => boolean)) => {
  const value = typeof active === 'function'
    ? active(isControlled ? controlledIsActive : internalIsActive)
    : active;
  if (isControlled && onActiveChange) {
    onActiveChange(value);
  } else {
    dispatch({ type: 'SET_IS_ACTIVE', payload: { internalIsActive: value } });
  }
}, [isControlled, controlledIsActive, internalIsActive, onActiveChange]);
```

**Proposed Implementation**:

**Location**: `src/hooks/useActivation.ts`

```typescript
export interface UseActivationOptions {
  controlledIsActive?: boolean;
  onActiveChange?: (active: boolean) => void;
  defaultOpen?: boolean;
}

export interface UseActivationReturn {
  isActive: boolean;
  setIsActive: (active: boolean | ((prev: boolean) => boolean)) => void;
  toggle: () => void;
  activate: () => void;
  deactivate: () => void;
}

export function useActivation(options: UseActivationOptions = {}): UseActivationReturn {
  // Implementation extracted from FeedbackProvider
}
```

**Acceptance Criteria**:

- [x] Hook manages internal activation state
- [x] Hook supports controlled mode via `controlledIsActive` prop
- [x] Hook calls `onActiveChange` callback when in controlled mode
- [x] Hook provides convenience methods: `toggle`, `activate`, `deactivate`
- [x] Hook is properly typed with TypeScript
- [x] Existing FeedbackProvider behavior is preserved when using this hook
- [x] Unit tests achieve 90%+ coverage (34 tests)

**Testing**:

- [x] Test uncontrolled mode (internal state management) - 12 tests
- [x] Test controlled mode (external state management) - 11 tests
- [x] Test callback invocation in controlled mode
- [x] Test toggle, activate, deactivate methods
- [x] Test initial state with defaultOpen
- [x] Test callback stability - 5 tests
- [x] Test edge cases - 5 tests
- [x] Integration tests - 2 tests

**Dependencies**: I010 (Extract Reducer to Separate File) ✅

**Notes**:
This is one of the most fundamental hooks as activation state controls whether the entire feedback system is active.

---

### T002 - Create useDashboard Hook

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**:
Extract dashboard state management from FeedbackProvider into a dedicated `useDashboard` hook. This hook controls the dashboard panel visibility and provides a focused interface for components that need to open/close the feedback dashboard.

**Current State**:
In FeedbackProvider.tsx:

```typescript
const isDashboardOpen = state.isDashboardOpen;

const setIsDashboardOpen = useCallback((open: boolean) => {
  if (open) {
    dispatch({ type: 'OPEN_DASHBOARD' });
  } else {
    dispatch({ type: 'CLOSE_DASHBOARD' });
  }
}, []);
```

**Proposed Implementation**:

**Location**: `src/hooks/useDashboard.ts`

```typescript
export interface UseDashboardReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useDashboard(): UseDashboardReturn {
  const context = useFeedbackContext();

  return {
    isOpen: context.state.isDashboardOpen,
    open: useCallback(() => context.dispatch({ type: 'OPEN_DASHBOARD' }), []),
    close: useCallback(() => context.dispatch({ type: 'CLOSE_DASHBOARD' }), []),
    toggle: useCallback(() => {
      context.dispatch({
        type: context.state.isDashboardOpen ? 'CLOSE_DASHBOARD' : 'OPEN_DASHBOARD'
      });
    }, [context.state.isDashboardOpen]),
  };
}
```

**Acceptance Criteria**:

- [ ] Hook exposes `isOpen` state
- [ ] Hook provides `open`, `close`, and `toggle` methods
- [ ] Methods dispatch correct actions to reducer
- [ ] Hook is properly typed with TypeScript
- [ ] Unit tests achieve 90%+ coverage

**Testing**:

- [ ] Test initial closed state
- [ ] Test open method
- [ ] Test close method
- [ ] Test toggle method in both states

**Dependencies**: I010 (Extract Reducer to Separate File)

**Notes**:
Simple hook that provides focused dashboard visibility control.

---

### T003 - Create useRecording Hook

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**:
Extract screen recording functionality from FeedbackProvider into a dedicated `useRecording` hook. This hook manages the full recording lifecycle: start, stop, pause, resume, and cancel operations.

**Current State**:
In FeedbackProvider.tsx (lines 459-495):

```typescript
const handleStartRecording = useCallback(async () => {
  try {
    dispatch({ type: 'START_RECORDING' });
    await startRecording();
    dispatch({ type: 'RECORDING_STARTED' });
  } catch (error) {
    dispatch({ type: 'RECORDING_ERROR' });
  }
}, []);

const handleStopRecording = useCallback(async () => {
  const { blob, events } = await stopRecording();
  dispatch({ type: 'STOP_RECORDING', payload: { blob, events } });
}, []);

const handlePauseRecording = useCallback(() => {
  dispatch({ type: 'PAUSE_RECORDING' });
}, []);

const handleResumeRecording = useCallback(() => {
  dispatch({ type: 'RESUME_RECORDING' });
}, []);

const handleCancelRecording = useCallback(() => {
  dispatch({ type: 'CANCEL_RECORDING' });
}, []);
```

**Proposed Implementation**:

**Location**: `src/hooks/useRecording.ts`

```typescript
export interface UseRecordingOptions {
  recorderService?: RecorderService;
  onRecordingComplete?: (blob: Blob, events: EventLog[]) => void;
  onRecordingError?: (error: Error) => void;
}

export interface UseRecordingReturn {
  isRecording: boolean;
  isRecordingActive: boolean;
  isPaused: boolean;
  isInitializing: boolean;
  videoBlob: Blob | null;
  eventLogs: EventLog[];
  start: () => Promise<void>;
  stop: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
}

export function useRecording(options: UseRecordingOptions = {}): UseRecordingReturn {
  // Implementation with injected RecorderService
}
```

**Acceptance Criteria**:

- [ ] Hook manages all recording states (isRecording, isPaused, isInitializing)
- [ ] Hook provides start, stop, pause, resume, cancel methods
- [ ] Hook accepts RecorderService via dependency injection
- [ ] Hook handles errors and dispatches appropriate actions
- [ ] Hook exposes videoBlob and eventLogs after recording completes
- [ ] Hook is properly typed with TypeScript
- [ ] Unit tests achieve 90%+ coverage

**Testing**:

- [ ] Test start recording flow
- [ ] Test stop recording flow
- [ ] Test pause/resume functionality
- [ ] Test cancel functionality
- [ ] Test error handling
- [ ] Test with mock RecorderService

**Dependencies**:

- I010 (Extract Reducer to Separate File)
- I007 (Create RecorderService Interface & Impl)

**Notes**:
This hook should accept RecorderService via props/context to enable testing with mock implementations.

---

### T004 - Create useScreenCapture Hook

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**:
Extract screenshot capture functionality from FeedbackProvider into a dedicated `useScreenCapture` hook. This hook handles capturing screenshots of selected elements or the entire viewport.

**Current State**:
In FeedbackProvider.tsx (lines 441-457):

```typescript
const handleElementClick = useCallback(async (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  dispatch({ type: 'CAPTURE_START' });
  try {
    const screenshotData = await captureScreenshot(hoveredElement);
    dispatch({ type: 'CAPTURE_COMPLETE', payload: screenshotData });
  } catch (error) {
    dispatch({ type: 'CAPTURE_ERROR', payload: { error } });
  }
}, [hoveredElement]);
```

**Proposed Implementation**:

**Location**: `src/hooks/useScreenCapture.ts`

```typescript
export interface UseScreenCaptureOptions {
  screenshotService?: ScreenshotService;
  onCaptureComplete?: (screenshot: string) => void;
  onCaptureError?: (error: Error) => void;
}

export interface UseScreenCaptureReturn {
  isCapturing: boolean;
  screenshot: string | null;
  capture: (element?: HTMLElement) => Promise<string>;
  captureViewport: () => Promise<string>;
  clear: () => void;
}

export function useScreenCapture(options: UseScreenCaptureOptions = {}): UseScreenCaptureReturn {
  // Implementation with injected ScreenshotService
}
```

**Acceptance Criteria**:

- [ ] Hook manages capture state (isCapturing)
- [ ] Hook provides capture method for specific elements
- [ ] Hook provides captureViewport method for full viewport
- [ ] Hook accepts ScreenshotService via dependency injection
- [ ] Hook handles errors appropriately
- [ ] Hook is properly typed with TypeScript
- [ ] Unit tests achieve 90%+ coverage

**Testing**:

- [ ] Test element capture
- [ ] Test viewport capture
- [ ] Test error handling
- [ ] Test clear functionality
- [ ] Test with mock ScreenshotService

**Dependencies**:

- I010 (Extract Reducer to Separate File)
- I008 (Create ScreenshotService Interface)

**Notes**:
Uses html2canvas or similar under the hood, but abstracted behind ScreenshotService.

---

### T005 - Create useElementSelection Hook

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**:
Extract element selection (hover/click) functionality from FeedbackProvider into a dedicated `useElementSelection` hook. This hook manages mouse movement tracking, element highlighting, and element selection for feedback capture.

**Current State**:
In FeedbackProvider.tsx (lines 383-439):

```typescript
const isValidElement = useCallback((element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}, []);

const handleMouseMove = useCallback((e: MouseEvent) => {
  if (throttleRef.current) return;
  throttleRef.current = requestAnimationFrame(() => {
    throttleRef.current = null;
    const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
    if (element && isValidElement(element) && element !== lastElementRef.current) {
      lastElementRef.current = element;
      const componentInfo = getReactComponentInfo(element);
      const rect = element.getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      dispatch({
        type: 'SET_HOVERED_ELEMENT',
        payload: {
          element,
          componentInfo,
          highlightStyle: {
            left: rect.left + scrollX,
            top: rect.top + scrollY,
            width: rect.width,
            height: rect.height,
          },
          tooltipStyle: {
            left: e.clientX + 10,
            top: e.clientY + 10,
          },
        },
      });
    }
  });
}, [isValidElement]);
```

**Proposed Implementation**:

**Location**: `src/hooks/useElementSelection.ts`

```typescript
export interface ElementInfo {
  element: HTMLElement;
  componentInfo: ComponentInfo | null;
  rect: DOMRect;
}

export interface UseElementSelectionOptions {
  enabled?: boolean;
  throttleMs?: number;
  onElementHover?: (info: ElementInfo) => void;
  onElementSelect?: (info: ElementInfo) => void;
}

export interface UseElementSelectionReturn {
  hoveredElement: HTMLElement | null;
  selectedElement: HTMLElement | null;
  hoveredComponentInfo: ComponentInfo | null;
  highlightStyle: HighlightStyle | null;
  tooltipStyle: TooltipStyle | null;
  enable: () => void;
  disable: () => void;
  clearSelection: () => void;
}

export function useElementSelection(options: UseElementSelectionOptions = {}): UseElementSelectionReturn {
  // Implementation with mouse move/click handlers
}
```

**Acceptance Criteria**:

- [ ] Hook tracks mouse movement and identifies hovered elements
- [ ] Hook calculates and exposes highlight styles
- [ ] Hook calculates and exposes tooltip styles
- [ ] Hook extracts React component info from elements
- [ ] Hook supports enable/disable for activation control
- [ ] Hook uses requestAnimationFrame for throttling
- [ ] Hook properly cleans up event listeners
- [ ] Hook is properly typed with TypeScript
- [ ] Unit tests achieve 90%+ coverage

**Testing**:

- [ ] Test mouse move handling
- [ ] Test element highlighting calculation
- [ ] Test tooltip positioning
- [ ] Test enable/disable functionality
- [ ] Test cleanup on unmount
- [ ] Test with various element types

**Dependencies**: I010 (Extract Reducer to Separate File)

**Notes**:
This is a complex hook that handles DOM interaction and requires careful cleanup.

---

### T006 - Create useKeyboardShortcuts Hook

**Status**: 🔲 TODO
**Priority**: 🟡 Medium

**Description**:
Extract keyboard shortcut handling from FeedbackProvider into a dedicated `useKeyboardShortcuts` hook. This hook manages keyboard events for actions like canceling selection, submitting feedback, etc.

**Current State**:
In FeedbackProvider.tsx (lines 498-545):

```typescript
const handleKeyDown = useCallback((e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (isCanvasActive) {
      dispatch({ type: 'CLOSE_CANVAS', payload: { isCanvasActive: false } });
    } else if (isActive) {
      // Cancel selection
    }
  }
  // More keyboard handling...
}, [isActive, isCanvasActive, ...]);
```

**Proposed Implementation**:

**Location**: `src/hooks/useKeyboardShortcuts.ts`

```typescript
export interface KeyboardShortcut {
  key: string;
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[];
  action: () => void;
  enabled?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export interface UseKeyboardShortcutsReturn {
  enable: () => void;
  disable: () => void;
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (key: string) => void;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions): UseKeyboardShortcutsReturn {
  // Implementation with configurable shortcuts
}
```

**Acceptance Criteria**:

- [ ] Hook accepts configurable shortcut definitions
- [ ] Hook supports modifier keys (Ctrl, Shift, Alt, Meta)
- [ ] Hook provides enable/disable functionality
- [ ] Hook supports dynamic shortcut registration
- [ ] Hook properly cleans up event listeners
- [ ] Hook is properly typed with TypeScript
- [ ] Unit tests achieve 90%+ coverage

**Testing**:

- [ ] Test basic key handling
- [ ] Test modifier key combinations
- [ ] Test enable/disable
- [ ] Test dynamic registration/unregistration
- [ ] Test cleanup on unmount

**Dependencies**: I010 (Extract Reducer to Separate File)

**Notes**:
Consider using existing keyboard shortcut libraries or patterns for consistency.

---

### T007 - Create useFeedbackSubmission Hook

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**:
Extract feedback submission queue management from FeedbackProvider into a dedicated `useFeedbackSubmission` hook. This hook manages the async submission of feedback with retry logic and queue management.

**Current State**:
In FeedbackProvider.tsx (lines 588-703):

```typescript
const handleAsyncSubmit = useCallback(async (feedbackData: FeedbackData) => {
  const submissionId = generateSubmissionId();
  dispatch({
    type: 'ADD_SUBMISSION',
    payload: {
      id: submissionId,
      status: 'pending',
      feedbackData,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    },
  });

  // ... submission logic with timeout and retry
}, [integrationClient, integrations, ...]);
```

**Proposed Implementation**:

**Location**: `src/hooks/useFeedbackSubmission.ts`

```typescript
export interface SubmissionQueueItem {
  id: string;
  status: 'pending' | 'submitting' | 'success' | 'error';
  feedbackData: FeedbackData;
  retryCount: number;
  createdAt: string;
  error?: string;
}

export interface UseFeedbackSubmissionOptions {
  maxRetries?: number;
  timeoutMs?: number;
  onSubmissionComplete?: (id: string, result: SubmissionResult) => void;
  onSubmissionError?: (id: string, error: Error) => void;
}

export interface UseFeedbackSubmissionReturn {
  queue: SubmissionQueueItem[];
  submit: (feedbackData: FeedbackData) => Promise<string>;
  retry: (submissionId: string) => Promise<void>;
  dismiss: (submissionId: string) => void;
  clearCompleted: () => void;
}

export function useFeedbackSubmission(options: UseFeedbackSubmissionOptions = {}): UseFeedbackSubmissionReturn {
  // Implementation with queue management
}
```

**Acceptance Criteria**:

- [ ] Hook manages submission queue state
- [ ] Hook provides submit method that returns submission ID
- [ ] Hook supports retry functionality
- [ ] Hook supports configurable timeout
- [ ] Hook supports dismiss and clearCompleted
- [ ] Hook handles async submissions with proper state updates
- [ ] Hook is properly typed with TypeScript
- [ ] Unit tests achieve 90%+ coverage

**Testing**:

- [ ] Test successful submission flow
- [ ] Test failed submission with retry
- [ ] Test timeout handling
- [ ] Test queue management
- [ ] Test dismiss functionality

**Dependencies**: I010 (Extract Reducer to Separate File)

**Notes**:
This hook handles the complex async submission logic including timeout racing.

---

### T008 - Create useIntegrations Hook

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**:
Extract integration management from FeedbackProvider into a dedicated `useIntegrations` hook. This hook manages integration client configuration, status tracking, and result handling for Jira, Google Sheets, and other integrations.

**Current State**:
In FeedbackProvider.tsx:

```typescript
const integrationClientRef = useRef<IntegrationClient | null>(null);
const integrationStatus = state.integrationStatus;

useEffect(() => {
  if (integrations) {
    integrationClientRef.current = new IntegrationClient({
      jira: integrations.jira,
      sheets: integrations.sheets,
      onSuccess: (type) => dispatch({ type: 'INTEGRATION_SUCCESS', ... }),
      onError: (type, error) => dispatch({ type: 'INTEGRATION_ERROR', ... }),
    });
  }
}, [integrations, onIntegrationSuccess, onIntegrationError]);
```

**Proposed Implementation**:

**Location**: `src/hooks/useIntegrations.ts`

```typescript
export interface UseIntegrationsOptions {
  config?: IntegrationConfig;
  onSuccess?: (type: IntegrationType, result: IntegrationResult) => void;
  onError?: (type: IntegrationType, error: Error) => void;
}

export interface IntegrationStatusMap {
  jira: { loading: boolean; error: string | null; result: IntegrationResult | null };
  sheets: { loading: boolean; error: string | null; result: IntegrationResult | null };
}

export interface UseIntegrationsReturn {
  status: IntegrationStatusMap;
  lastResults: Record<IntegrationType, IntegrationResult | null>;
  client: IntegrationClient | null;
  isConfigured: (type: IntegrationType) => boolean;
  submit: (type: IntegrationType, data: FeedbackData) => Promise<IntegrationResult>;
  getConfigModal: (type: IntegrationType) => React.ComponentType | null;
}

export function useIntegrations(options: UseIntegrationsOptions = {}): UseIntegrationsReturn {
  // Implementation with IntegrationFactory
}
```

**Acceptance Criteria**:

- [ ] Hook initializes IntegrationClient from config
- [ ] Hook tracks status for each integration type
- [ ] Hook provides isConfigured check for each type
- [ ] Hook provides submit method for each integration
- [ ] Hook exposes last results for each integration
- [ ] Hook handles success/error callbacks
- [ ] Hook is properly typed with TypeScript
- [ ] Unit tests achieve 90%+ coverage

**Testing**:

- [ ] Test client initialization
- [ ] Test status tracking
- [ ] Test isConfigured for various states
- [ ] Test submit flow
- [ ] Test error handling
- [ ] Test with mock integrations

**Dependencies**:

- I010 (Extract Reducer to Separate File)
- I020 (Create Base Integration Interface)

**Notes**:
This hook should work with the new IntegrationFactory once it's implemented.

---

## Summary

| ID   | Title                                | Priority   | Status     | Dependencies     |
|------|--------------------------------------|------------|------------|------------------|
| T001 | Create useActivation Hook            | 🟢 High    | 🔲 TODO    | I010             |
| T002 | Create useDashboard Hook             | 🟢 High    | 🔲 TODO    | I010             |
| T003 | Create useRecording Hook             | 🟢 High    | 🔲 TODO    | I010, I007       |
| T004 | Create useScreenCapture Hook         | 🟢 High    | 🔲 TODO    | I010, I008       |
| T005 | Create useElementSelection Hook      | 🟢 High    | 🔲 TODO    | I010             |
| T006 | Create useKeyboardShortcuts Hook     | 🟡 Medium  | 🔲 TODO    | I010             |
| T007 | Create useFeedbackSubmission Hook    | 🟢 High    | 🔲 TODO    | I010             |
| T008 | Create useIntegrations Hook          | 🟢 High    | 🔲 TODO    | I010, I020       |

---

## Related Documents

- [TASKS-OVERVIEW.md](./TASKS-OVERVIEW.md) - Main task overview
- [TASKS-IMPROVEMENTS.md](./TASKS-IMPROVEMENTS.md) - Improvement tasks including I010, I007, I008, I020
- [Architecture Refactoring Analysis](../architecture-refactoring-analysis.md) - Source specification
