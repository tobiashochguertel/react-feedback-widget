# Architecture Refactoring Analysis

## Executive Summary

This document provides a comprehensive analysis of the react-visual-feedback codebase for SOLID principles violations, code smells, and architectural improvement opportunities. The TypeScript migration is complete, but the codebase would benefit from significant refactoring to improve maintainability, testability, and extensibility.

**Total Source Lines:** ~13,000 lines across 15 TypeScript files

## Critical Findings

### 1. Single Responsibility Principle (SRP) Violations

#### FeedbackDashboard.tsx (1,158 lines) - **CRITICAL**

**Problems:**

- Contains 59 symbols (functions, interfaces, components)
- Handles multiple concerns:
  - IndexedDB video storage operations (`openVideoDatabase`, `getVideoFromIndexedDB`, `saveVideoToIndexedDB`)
  - Local storage operations (`saveFeedbackToLocalStorage`)
  - Date formatting (`formatRelativeDate`)
  - Status management (`DEFAULT_STATUSES`, `mergedStatuses`)
  - Session replay wrapper component
  - Video mode UI
  - Dashboard UI
  - 25+ styled-components

**Refactoring Recommendations:**

1. **Extract IndexedDB Service** - `services/VideoStorageService.ts`

   ```typescript
   export class VideoStorageService {
     async openDatabase(): Promise<IDBDatabase>;
     async getVideo(id: string): Promise<Blob | null>;
     async saveVideo(id: string, blob: Blob): Promise<void>;
   }
   ```

2. **Extract LocalStorage Service** - `services/FeedbackStorageService.ts`

   ```typescript
   export class FeedbackStorageService {
     getAll(): FeedbackData[];
     save(data: FeedbackData): void;
     delete(id: string): void;
   }
   ```

3. **Extract Date Utilities** - `utils/dateUtils.ts`

   ```typescript
   export function formatRelativeDate(date: string): string;
   ```

4. **Split Component** into:
   - `components/Dashboard/DashboardContainer.tsx` - Main orchestrator
   - `components/Dashboard/DashboardHeader.tsx` - Header with search/filter
   - `components/Dashboard/FeedbackList.tsx` - List of feedback items
   - `components/Dashboard/FeedbackCard.tsx` - Individual feedback card
   - `components/Dashboard/VideoMode.tsx` - Fullscreen video player
   - `components/Dashboard/styled/` - All styled components

#### FeedbackProvider.tsx (899 lines) - **HIGH**

**Problems:**

- 11 top-level symbols but extremely complex `FeedbackProvider` function
- Giant reducer with 25+ action types
- Mixes UI concerns (overlay, tooltip) with business logic
- Contains screenshot capture, recording control, form handling
- Too many useCallback hooks in one component (15+)

**Refactoring Recommendations:**

1. **Extract State Machine** - `state/feedbackStateMachine.ts`

   ```typescript
   // Use XState or similar for complex state transitions
   export const feedbackMachine = createMachine({
     id: "feedback",
     initial: "idle",
     states: {
       idle: { on: { ACTIVATE: "selecting" } },
       selecting: { on: { SELECT_ELEMENT: "captured" } },
       captured: { on: { OPEN_CANVAS: "annotating" } },
       // ...
     },
   });
   ```

2. **Extract Custom Hooks**:

   - `hooks/useElementSelection.ts` - Mouse move, click, highlight logic
   - `hooks/useScreenCapture.ts` - Screenshot capture logic
   - `hooks/useScreenRecording.ts` - Recording start/stop/pause
   - `hooks/useKeyboardShortcuts.ts` - Keyboard event handling
   - `hooks/useFeedbackSubmission.ts` - Submission queue management

3. **Extract UI Components**:
   - `components/Overlay/SelectionOverlay.tsx`
   - `components/Overlay/ElementHighlight.tsx`
   - `components/Overlay/ElementTooltip.tsx`

#### integrations/jira.ts (1,062 lines) & sheets.ts (1,035 lines) - **HIGH**

**Problems:**

- Nearly identical structure (code duplication)
- Each contains 1000+ lines for a single integration
- Mixes validation, UI components, API calls
- Contains full modal UIs inside integration handlers

**Refactoring Recommendations:**

1. **Create Base Integration Class** - `integrations/BaseIntegration.ts`

   ```typescript
   export abstract class BaseIntegration<TConfig, TPayload> {
     abstract validateConfig(config: TConfig): ValidationResult;
     abstract transformPayload(data: FeedbackData): TPayload;
     abstract submit(payload: TPayload): Promise<IntegrationResult>;
     abstract renderConfigModal(): React.ReactElement;
   }
   ```

2. **Use Composition Pattern**:

   - `integrations/jira/JiraIntegration.ts` - API logic only
   - `integrations/jira/JiraConfigModal.tsx` - UI component
   - `integrations/jira/jiraValidation.ts` - Validation logic
   - `integrations/sheets/` - Same structure

3. **Create Shared Components**:
   - `components/IntegrationModal/` - Base modal component
   - `components/IntegrationFields/` - Reusable form fields

---

### 2. Open/Closed Principle (OCP) Violations

#### Status System - **MEDIUM**

**Problem:** `DEFAULT_STATUSES` is defined inline with hardcoded values. Adding new statuses requires modifying `FeedbackDashboard.tsx`.

**Recommendation:** Use a plugin/registry pattern:

```typescript
// status/StatusRegistry.ts
export class StatusRegistry {
  private statuses: Map<string, StatusConfig> = new Map();

  register(key: string, config: StatusConfig): void;
  get(key: string): StatusConfig | undefined;
  getAll(): StatusConfig[];
}

// Usage
statusRegistry.register('custom', { label: 'Custom', ... });
```

#### Integration System - **HIGH**

**Problem:** Adding new integrations requires modifying multiple files. Current approach has hardcoded Jira/Sheets checks throughout.

**Recommendation:** Use factory pattern:

```typescript
// integrations/IntegrationFactory.ts
export class IntegrationFactory {
  private integrations: Map<string, IntegrationConstructor> = new Map();

  register(type: string, constructor: IntegrationConstructor): void;
  create(type: string, config: IntegrationConfig): Integration;
}
```

---

### 3. Liskov Substitution Principle (LSP) Violations

#### No Abstract Interfaces - **MEDIUM**

**Problem:** Components accept broad `any` types or no common interfaces. For example:

- `FeedbackDashboard` accepts `data?: FeedbackData[]` but processes items expecting specific shapes
- Integration handlers expect different config shapes

**Recommendation:** Define strict interfaces and ensure all implementations satisfy them:

```typescript
// types/Integration.ts
export interface Integration {
  readonly type: IntegrationType;
  isConfigured(): boolean;
  submit(data: FeedbackData): Promise<IntegrationResult>;
  getConfigModal(): React.ComponentType<ConfigModalProps>;
}
```

---

### 4. Interface Segregation Principle (ISP) Violations

#### FeedbackContextValue is Too Large - **HIGH**

**Problem:** `useFeedback` hook returns 10+ values, but most consumers only need 1-2:

```typescript
interface FeedbackContextValue {
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  setIsDashboardOpen: (open: boolean) => void;
  startRecording: () => void;
  integrations: IntegrationConfig;
  integrationStatus: IntegrationStatus;
  integrationClient: IntegrationClient;
  tooltipContent: TooltipContent | null;
  // ... more
}
```

**Recommendation:** Split into focused hooks:

```typescript
// hooks/useActivation.ts
export function useActivation() {
  return { isActive, setIsActive };
}

// hooks/useDashboard.ts
export function useDashboard() {
  return { isOpen, open, close };
}

// hooks/useRecording.ts
export function useRecording() {
  return { isRecording, start, stop, pause, resume };
}

// hooks/useIntegrations.ts
export function useIntegrations() {
  return { status, client, results };
}
```

---

### 5. Dependency Inversion Principle (DIP) Violations

#### Direct Dependencies on Concrete Implementations - **HIGH**

**Problems:**

1. `FeedbackProvider` directly instantiates `IntegrationClient`
2. Components directly call `localStorage` and `indexedDB` APIs
3. `recorder.ts` directly uses `navigator.mediaDevices`

**Recommendations:**

1. **Inject Dependencies via Props/Context**:

```typescript
interface FeedbackProviderDeps {
  storage: StorageService;
  recorder: RecorderService;
  integrations: IntegrationFactory;
}

<FeedbackProvider deps={dependencies}>
```

1. **Create Abstractions**:

```typescript
// services/StorageService.ts
export interface StorageService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

// services/LocalStorageService.ts
export class LocalStorageService implements StorageService { ... }

// services/InMemoryStorageService.ts (for testing)
export class InMemoryStorageService implements StorageService { ... }
```

---

## Code Smells Identified

### 1. Long Methods

| File                     | Function                   | Lines | Recommendation                |
| ------------------------ | -------------------------- | ----- | ----------------------------- |
| `FeedbackDashboard.tsx`  | `FeedbackDashboard`        | 350+  | Split into smaller components |
| `FeedbackProvider.tsx`   | `FeedbackProvider`         | 620+  | Extract hooks                 |
| `integrations/jira.ts`   | `JiraConfigurationModal`   | 400+  | Split into sub-components     |
| `integrations/sheets.ts` | `SheetsConfigurationModal` | 400+  | Split into sub-components     |
| `recorder.ts`            | `startRecording`           | 150+  | Extract helper functions      |

### 2. Duplicated Code

| Pattern              | Files                                 | Recommendation                           |
| -------------------- | ------------------------------------- | ---------------------------------------- |
| Modal styling        | jira.ts, sheets.ts, FeedbackModal.tsx | Create `<BaseModal>` component           |
| Form validation      | jira.ts, sheets.ts, config.ts         | Create validation utilities              |
| Error handling       | All integration files                 | Create `<ErrorBoundary>` and error utils |
| Status badge styling | Multiple files                        | Use `<StatusBadge>` consistently         |
| Theme access         | All styled-components                 | Create theme hooks                       |

### 3. Magic Numbers/Strings

```typescript
// Found in multiple files
const MAX_VIDEO_SIZE_MB = 50;
const VIDEO_DB_NAME = "feedback_videos";
const FEEDBACK_STORAGE_KEY = "feedback_list";
```

**Recommendation:** Create `constants/` directory:

```typescript
// constants/storage.ts
export const STORAGE = {
  VIDEO_DB_NAME: "feedback_videos",
  VIDEO_STORE_NAME: "videos",
  FEEDBACK_KEY: "feedback_list",
  MAX_VIDEO_SIZE_MB: 50,
} as const;
```

### 4. Complex Conditional Logic

In `FeedbackProvider.tsx`, the reducer has 25+ action types with complex nested conditions. This should be refactored to a state machine pattern.

---

## Proposed Directory Structure

```structure
src/
├── components/
│   ├── Dashboard/
│   │   ├── DashboardContainer.tsx
│   │   ├── DashboardHeader.tsx
│   │   ├── FeedbackList.tsx
│   │   ├── FeedbackCard.tsx
│   │   ├── VideoMode.tsx
│   │   ├── index.ts
│   │   └── styled/
│   │       └── DashboardStyled.ts
│   ├── Modal/
│   │   ├── BaseModal.tsx
│   │   ├── FeedbackModal.tsx
│   │   └── UpdatesModal.tsx
│   ├── Overlay/
│   │   ├── SelectionOverlay.tsx
│   │   ├── ElementHighlight.tsx
│   │   ├── ElementTooltip.tsx
│   │   ├── CanvasOverlay.tsx
│   │   └── RecordingOverlay.tsx
│   ├── Status/
│   │   ├── StatusBadge.tsx
│   │   ├── StatusDropdown.tsx
│   │   └── index.ts
│   └── shared/
│       ├── Button.tsx
│       ├── Input.tsx
│       └── Toast.tsx
├── hooks/
│   ├── useActivation.ts
│   ├── useDashboard.ts
│   ├── useRecording.ts
│   ├── useScreenCapture.ts
│   ├── useElementSelection.ts
│   ├── useKeyboardShortcuts.ts
│   ├── useFeedbackSubmission.ts
│   └── useIntegrations.ts
├── services/
│   ├── storage/
│   │   ├── StorageService.ts (interface)
│   │   ├── LocalStorageService.ts
│   │   └── IndexedDBService.ts
│   ├── recording/
│   │   ├── RecorderService.ts (interface)
│   │   └── MediaRecorderService.ts
│   └── screenshot/
│       ├── ScreenshotService.ts (interface)
│       └── Html2CanvasService.ts
├── integrations/
│   ├── types.ts
│   ├── IntegrationFactory.ts
│   ├── IntegrationRegistry.ts
│   ├── jira/
│   │   ├── JiraIntegration.ts
│   │   ├── JiraConfigModal.tsx
│   │   ├── jiraApi.ts
│   │   └── jiraValidation.ts
│   ├── sheets/
│   │   ├── SheetsIntegration.ts
│   │   ├── SheetsConfigModal.tsx
│   │   ├── sheetsApi.ts
│   │   └── sheetsValidation.ts
│   └── server/
│       └── index.ts
├── state/
│   ├── FeedbackContext.tsx
│   ├── feedbackReducer.ts
│   ├── actions.ts
│   └── selectors.ts
├── constants/
│   ├── storage.ts
│   ├── keyboard.ts
│   └── status.ts
├── utils/
│   ├── dateUtils.ts
│   ├── elementUtils.ts
│   ├── formatters.ts
│   └── validation.ts
├── theme/
│   ├── theme.ts
│   ├── lightTheme.ts
│   ├── darkTheme.ts
│   └── styled.d.ts
├── types/
│   ├── feedback.ts
│   ├── status.ts
│   ├── integration.ts
│   └── index.ts
└── index.ts
```

---

## Refactoring Priority

### Phase 1: Foundation (1-2 weeks)

1. ✅ Create directory structure
2. ✅ Extract constants
3. ✅ Extract utility functions
4. ✅ Create service interfaces

### Phase 2: Services (1-2 weeks)

1. ✅ Extract StorageService
2. ✅ Extract RecorderService
3. ✅ Extract ScreenshotService
4. ✅ Add dependency injection

### Phase 3: State Management (1 week)

1. ✅ Extract reducer to separate file
2. ✅ Create action creators
3. ✅ Create selectors
4. ❓ Consider XState for complex state

### Phase 4: Component Refactoring (2-3 weeks)

1. ✅ Split FeedbackDashboard
2. ✅ Split FeedbackProvider
3. ✅ Create shared components
4. ✅ Extract custom hooks

### Phase 5: Integration Refactoring (1-2 weeks)

1. ✅ Create BaseIntegration
2. ✅ Refactor Jira integration
3. ✅ Refactor Sheets integration
4. ✅ Create IntegrationFactory

### Phase 6: Testing (Ongoing)

1. ✅ Unit tests for services
2. ✅ Unit tests for hooks
3. ✅ Component tests
4. ✅ Integration tests

---

## Metrics to Track

| Metric                | Current     | Target      |
| --------------------- | ----------- | ----------- |
| Max file size         | 1,158 lines | < 300 lines |
| Max function size     | 620 lines   | < 50 lines  |
| Cyclomatic complexity | High        | Low         |
| Test coverage         | ~60%        | > 85%       |
| Type safety           | Strict      | Strict      |

---

## Conclusion

The TypeScript migration provides a solid foundation for refactoring. The main issues are:

1. **SRP violations** - Files doing too many things
2. **Tight coupling** - Components directly depend on browser APIs
3. **Code duplication** - Integration modals share 80%+ code
4. **Complex state** - Reducer is too large and hard to test

Following this refactoring plan will result in:

- Easier testing (services can be mocked)
- Better maintainability (smaller, focused modules)
- Easier extensibility (adding integrations via registry)
- Improved developer experience (better IntelliSense, clearer structure)

---

**Analysis completed:** January 2025
**Analyzed by:** GitHub Copilot
**For project:** react-visual-feedback
