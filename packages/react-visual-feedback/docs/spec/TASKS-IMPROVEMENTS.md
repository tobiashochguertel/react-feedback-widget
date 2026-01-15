# React Visual Feedback - Improvement Tasks

**Created:** 2026-01-15
**Updated:** 2026-01-15
**Parent Document:** [TASKS-OVERVIEW.md](./TASKS-OVERVIEW.md)

> This document contains detailed descriptions of all improvement tasks (I###) for the react-visual-feedback architecture refactoring. Improvements enhance existing functionality, code quality, and architectural patterns.

---

## Overview

The Improvement tasks address SOLID principle violations and code smells identified in the architecture analysis.

**Status**: Set 8 (Overlay Components) - COMPLETE ✅

- Set 1 (Foundation Setup) - COMPLETE ✅
- Set 2 (Service Layer Extraction) - COMPLETE ✅
- Set 3 (State Management Refactoring) - COMPLETE ✅
- Set 5 (Dashboard Component Refactoring) - COMPLETE ✅
- Set 6 (Integration System Refactoring I020-I024) - COMPLETE ✅
- Set 7 (Shared Components I025-I028) - COMPLETE ✅
- Set 8 (Overlay Components I029-I031) - COMPLETE ✅

- **SRP Violations**: FeedbackDashboard (1,158 lines), FeedbackProvider (899 lines), jira.ts (1,062 lines), sheets.ts (1,035 lines)
- **DIP Violations**: Direct dependencies on localStorage, IndexedDB, navigator.mediaDevices
- **OCP Violations**: Hardcoded status system and integration checks
- **Code Smells**: Magic numbers, duplicated code, complex conditional logic

---

## Foundation Setup (Set 1)

### I001 - Create Directory Structure

**Status**: ✅ Done
**Priority**: 🟢 High

**Description**:
Create the new directory structure to organize the codebase by concern. This is the foundation for all subsequent refactoring work.

**Proposed Structure**:

```
src/
├── components/
│   ├── Dashboard/
│   ├── Modal/
│   ├── Overlay/
│   ├── Status/
│   └── shared/
├── hooks/
├── services/
│   ├── storage/
│   ├── recording/
│   └── screenshot/
├── integrations/
│   ├── jira/
│   ├── sheets/
│   └── server/
├── state/
├── constants/
├── utils/
├── theme/
├── types/
└── index.ts
```

**Implementation**:

- Create all directories
- Add `index.ts` barrel files where needed
- Update existing imports incrementally

**Acceptance Criteria**:

- [ ] All directories created
- [ ] Barrel files (`index.ts`) in major directories
- [ ] No breaking changes to existing code
- [ ] Build still passes

**Testing**:

- [ ] Verify build passes
- [ ] Verify all imports resolve

**Dependencies**: None

---

### I002 - Extract Constants to Dedicated Module

**Status**: ✅ Done
**Priority**: 🟢 High

**Description**:
Extract all magic numbers and strings scattered throughout the codebase into a centralized constants module.

**Current State**:
Found in multiple files:

```typescript
const MAX_VIDEO_SIZE_MB = 50;
const VIDEO_DB_NAME = "feedback_videos";
const VIDEO_STORE_NAME = "videos";
const FEEDBACK_STORAGE_KEY = "feedback_list";
```

**Proposed Implementation**:

**Location**: `src/constants/storage.ts`

```typescript
export const STORAGE = {
  VIDEO_DB_NAME: "feedback_videos",
  VIDEO_STORE_NAME: "videos",
  FEEDBACK_KEY: "feedback_list",
  MAX_VIDEO_SIZE_MB: 50,
  MAX_VIDEO_SIZE_BYTES: 50 * 1024 * 1024,
} as const;

export type StorageKey = keyof typeof STORAGE;
```

**Location**: `src/constants/keyboard.ts`

```typescript
export const KEYBOARD = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  SPACE: ' ',
} as const;

export const DEFAULT_SHORTCUTS = {
  CANCEL: { key: 'Escape', modifiers: [] },
  SUBMIT: { key: 'Enter', modifiers: ['ctrl'] },
  TOGGLE: { key: 'f', modifiers: ['ctrl', 'shift'] },
} as const;
```

**Location**: `src/constants/status.ts`

```typescript
export const DEFAULT_STATUSES = {
  new: { key: 'new', label: 'New', color: '#3B82F6', bgColor: '#EFF6FF', textColor: '#1D4ED8', icon: '🆕' },
  open: { key: 'open', label: 'Open', color: '#F59E0B', bgColor: '#FFFBEB', textColor: '#B45309', icon: '📂' },
  inProgress: { key: 'inProgress', label: 'In Progress', color: '#8B5CF6', bgColor: '#F5F3FF', textColor: '#6D28D9', icon: '🔄' },
  underReview: { key: 'underReview', label: 'Under Review', color: '#EC4899', bgColor: '#FDF2F8', textColor: '#BE185D', icon: '👀' },
  resolved: { key: 'resolved', label: 'Resolved', color: '#10B981', bgColor: '#ECFDF5', textColor: '#047857', icon: '✅' },
  closed: { key: 'closed', label: 'Closed', color: '#6B7280', bgColor: '#F3F4F6', textColor: '#374151', icon: '📁' },
} as const;
```

**Location**: `src/constants/index.ts`

```typescript
export * from './storage';
export * from './keyboard';
export * from './status';
```

**Acceptance Criteria**:

- [ ] All magic numbers/strings extracted
- [ ] Constants are typed with `as const`
- [ ] Existing code updated to use constants
- [ ] Build passes
- [ ] Tests pass

**Testing**:

- [ ] Verify constants are correctly exported
- [ ] Verify existing functionality unchanged

**Dependencies**: I001

---

### I003 - Extract Utility Functions

**Status**: ✅ Done
**Priority**: 🟢 High

**Description**:
Extract utility functions from large components into dedicated utility modules.

**Current State**:
In FeedbackDashboard.tsx:

```typescript
function formatRelativeDate(date: string): string {
  const now = new Date();
  const diffTime = now.getTime() - new Date(date).getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  // ...
}
```

**Proposed Implementation**:

**Location**: `src/utils/dateUtils.ts`

```typescript
export function formatRelativeDate(date: string | Date): string {
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const diffTime = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  const month = dateObj.toLocaleString('default', { month: 'short' });
  const day = dateObj.getDate();
  return `${month} ${day}`;
}

export function formatTimestamp(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString();
}
```

**Location**: `src/utils/elementUtils.ts`

```typescript
export function getReactComponentInfo(element: HTMLElement): ComponentInfo | null {
  // Extract React component info from fiber
}

export function getElementSelector(element: HTMLElement): string {
  // Generate unique selector for element
}

export function isValidElement(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}
```

**Location**: `src/utils/validation.ts`

```typescript
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
```

**Acceptance Criteria**:

- [ ] Date utilities extracted and tested
- [ ] Element utilities extracted and tested
- [ ] Validation utilities extracted and tested
- [ ] Original code updated to use utilities
- [ ] No duplicate code remaining

**Testing**:

- [ ] Unit tests for formatRelativeDate
- [ ] Unit tests for element utilities
- [ ] Unit tests for validation utilities

**Dependencies**: I001

---

### I004 - Create Service Interfaces

**Status**: ✅ Done
**Priority**: 🟢 High

**Description**:
Define TypeScript interfaces for all services to enable dependency injection and testing. This follows the Dependency Inversion Principle.

**Proposed Implementation**:

**Location**: `src/services/storage/StorageService.ts`

```typescript
export interface StorageService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}
```

**Location**: `src/services/storage/VideoStorageService.ts`

```typescript
export interface VideoRecord {
  id: string;
  blob: Blob;
  timestamp: number;
}

export interface VideoStorageService {
  openDatabase(): Promise<void>;
  getVideo(id: string): Promise<Blob | null>;
  saveVideo(id: string, blob: Blob): Promise<void>;
  deleteVideo(id: string): Promise<void>;
  getAllVideos(): Promise<VideoRecord[]>;
}
```

**Location**: `src/services/recording/RecorderService.ts`

```typescript
export interface RecorderService {
  isSupported(): boolean;
  start(options?: RecordingOptions): Promise<void>;
  stop(): Promise<RecordingResult>;
  pause(): void;
  resume(): void;
  cancel(): void;
  getState(): RecordingState;
}

export interface RecordingOptions {
  mimeType?: string;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
}

export interface RecordingResult {
  blob: Blob;
  events: EventLog[];
  duration: number;
}

export type RecordingState = 'inactive' | 'recording' | 'paused';
```

**Location**: `src/services/screenshot/ScreenshotService.ts`

```typescript
export interface ScreenshotService {
  captureElement(element: HTMLElement): Promise<string>;
  captureViewport(): Promise<string>;
  captureArea(rect: DOMRect): Promise<string>;
}
```

**Acceptance Criteria**:

- [ ] All service interfaces defined
- [ ] Interfaces are exported from barrel files
- [ ] Interfaces are properly typed
- [ ] Documentation comments added

**Testing**:

- [ ] TypeScript compilation passes
- [ ] Interfaces can be implemented

**Dependencies**: I001

---

## Service Layer Extraction (Set 2)

Set 2 (Service Layer Extraction) - COMPLETE ✅

### I005 - Create StorageService Interface & Impl

**Status**: ✅ Done
**Priority**: 🟢 High

**Description**:
Implement LocalStorageService that wraps browser localStorage API. Create InMemoryStorageService for testing.

**Proposed Implementation**:

**Location**: `src/services/storage/LocalStorageService.ts`

```typescript
import { StorageService } from './StorageService';

export class LocalStorageService implements StorageService {
  get<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}
```

**Location**: `src/services/storage/InMemoryStorageService.ts`

```typescript
import { StorageService } from './StorageService';

export class InMemoryStorageService implements StorageService {
  private storage: Map<string, string> = new Map();

  get<T>(key: string): T | null {
    const item = this.storage.get(key);
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    this.storage.set(key, JSON.stringify(value));
  }

  remove(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }
}
```

**Acceptance Criteria**:

- [ ] LocalStorageService implements StorageService interface
- [ ] InMemoryStorageService implements StorageService interface
- [ ] Both implementations pass same test suite
- [ ] Error handling for JSON parse failures
- [ ] Unit tests achieve 95%+ coverage

**Testing**:

- [ ] Test get/set/remove/clear operations
- [ ] Test with various data types
- [ ] Test error handling
- [ ] Test InMemoryStorageService isolation

**Dependencies**: I001, I004

---

### I006 - Create VideoStorageService (IndexedDB)

**Status**: ✅ Done
**Priority**: 🟢 High

**Description**:
Extract IndexedDB operations from FeedbackDashboard into a dedicated VideoStorageService.

**Current State**:
In FeedbackDashboard.tsx (lines 575-638):

```typescript
function openVideoDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(VIDEO_DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(VIDEO_STORE_NAME)) {
        db.createObjectStore(VIDEO_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}
```

**Proposed Implementation**:

**Location**: `src/services/storage/IndexedDBVideoStorageService.ts`

```typescript
import { VideoStorageService, VideoRecord } from './VideoStorageService';
import { STORAGE } from '../../constants';

export class IndexedDBVideoStorageService implements VideoStorageService {
  private db: IDBDatabase | null = null;
  private dbName = STORAGE.VIDEO_DB_NAME;
  private storeName = STORAGE.VIDEO_STORE_NAME;

  async openDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async getVideo(id: string): Promise<Blob | null> {
    if (!this.db) await this.openDatabase();
    // Implementation...
  }

  async saveVideo(id: string, blob: Blob): Promise<void> {
    if (!this.db) await this.openDatabase();
    // Implementation...
  }

  async deleteVideo(id: string): Promise<void> {
    if (!this.db) await this.openDatabase();
    // Implementation...
  }

  async getAllVideos(): Promise<VideoRecord[]> {
    if (!this.db) await this.openDatabase();
    // Implementation...
  }
}
```

**Acceptance Criteria**:

- [ ] All IndexedDB operations extracted from FeedbackDashboard
- [ ] Implements VideoStorageService interface
- [ ] Lazy database initialization
- [ ] Error handling for all operations
- [ ] Size limit enforcement (MAX_VIDEO_SIZE_MB)
- [ ] Unit tests with fake-indexeddb

**Testing**:

- [ ] Test database initialization
- [ ] Test CRUD operations
- [ ] Test size limit enforcement
- [ ] Test error handling

**Dependencies**: I005

---

### I007 - Create RecorderService Interface & Impl

**Status**: ✅ Done
**Priority**: 🟢 High

**Description**:
Extract recording functionality from recorder.ts into a service implementing RecorderService interface.

**Current State**:
In recorder.ts (678 lines):

- Direct use of `navigator.mediaDevices`
- Complex recording logic with pause/resume
- Event logging during recording

**Proposed Implementation**:

**Location**: `src/services/recording/MediaRecorderService.ts`

```typescript
import { RecorderService, RecordingOptions, RecordingResult, RecordingState } from './RecorderService';

export class MediaRecorderService implements RecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private eventLogs: EventLog[] = [];
  private stream: MediaStream | null = null;

  isSupported(): boolean {
    return !!(navigator.mediaDevices && MediaRecorder);
  }

  async start(options?: RecordingOptions): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Screen recording is not supported in this browser');
    }

    this.stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: options?.mimeType || 'video/webm',
      videoBitsPerSecond: options?.videoBitsPerSecond,
      audioBitsPerSecond: options?.audioBitsPerSecond,
    });

    this.recordedChunks = [];
    this.setupEventListeners();
    this.mediaRecorder.start();
  }

  // ... other methods
}
```

**Acceptance Criteria**:

- [ ] Implements RecorderService interface
- [ ] Extracts all recording logic from recorder.ts
- [ ] Supports start/stop/pause/resume/cancel
- [ ] Collects event logs during recording
- [ ] Returns blob and events on stop
- [ ] Cleans up streams properly
- [ ] Unit tests with mocked MediaRecorder

**Testing**:

- [ ] Test isSupported check
- [ ] Test recording lifecycle
- [ ] Test pause/resume
- [ ] Test cancel with cleanup
- [ ] Test error handling

**Dependencies**: I001, I004

---

### I008 - Create ScreenshotService Interface

**Status**: ✅ Done
**Priority**: 🟢 High

**Description**:
Create ScreenshotService implementation that wraps html2canvas functionality.

**Proposed Implementation**:

**Location**: `src/services/screenshot/Html2CanvasService.ts`

```typescript
import html2canvas from 'html2canvas';
import { ScreenshotService } from './ScreenshotService';

export class Html2CanvasService implements ScreenshotService {
  async captureElement(element: HTMLElement): Promise<string> {
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      logging: false,
    });
    return canvas.toDataURL('image/png');
  }

  async captureViewport(): Promise<string> {
    return this.captureElement(document.body);
  }

  async captureArea(rect: DOMRect): Promise<string> {
    const canvas = await html2canvas(document.body, {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    });
    return canvas.toDataURL('image/png');
  }
}
```

**Acceptance Criteria**:

- [ ] Implements ScreenshotService interface
- [ ] captureElement captures single element
- [ ] captureViewport captures full viewport
- [ ] captureArea captures specific region
- [ ] Returns base64 encoded PNG
- [ ] Error handling for capture failures

**Testing**:

- [ ] Test element capture
- [ ] Test viewport capture
- [ ] Test area capture
- [ ] Test error handling

**Dependencies**: I001, I004

---

### I009 - Add Dependency Injection to Provider

**Status**: ✅ Done
**Priority**: 🟢 High

**Description**:
Create ServiceFactory to provide production and test service configurations with dependency injection support.

**Proposed Implementation**:

```typescript
interface FeedbackProviderDeps {
  storage?: StorageService;
  videoStorage?: VideoStorageService;
  recorder?: RecorderService;
  screenshot?: ScreenshotService;
}

interface FeedbackProviderProps extends FeedbackProviderDeps {
  children: React.ReactNode;
  // ... existing props
}

export function FeedbackProvider({
  children,
  storage = new LocalStorageService(),
  videoStorage = new IndexedDBVideoStorageService(),
  recorder = new MediaRecorderService(),
  screenshot = new Html2CanvasService(),
  ...props
}: FeedbackProviderProps) {
  // Use injected services instead of direct API calls
}
```

**Acceptance Criteria**:

- [ ] All services injectable via props
- [ ] Default implementations provided
- [ ] Services accessible via context
- [ ] Existing behavior unchanged
- [ ] Tests can inject mock services

**Testing**:

- [ ] Test with default services
- [ ] Test with injected mock services
- [ ] Verify existing behavior unchanged

**Dependencies**: I005-I008

---

## State Management Refactoring (Set 3)

### I010 - Extract Reducer to Separate File

**Status**: ✅ Done
**Priority**: 🟢 High

**Description**:
Extract the 25+ action type reducer from FeedbackProvider into a dedicated module.

**Current State**:
In FeedbackProvider.tsx (lines 132-270):

```typescript
function feedbackReducer(state: FeedbackState, action: FeedbackAction): FeedbackState {
  switch (action.type) {
    case 'SET_IS_ACTIVE':
      return { ...state, internalIsActive: action.payload.internalIsActive };
    case 'SET_HOVERED_ELEMENT':
      return { ...state, hoveredElement: action.payload.element, ... };
    // ... 25+ more cases
  }
}
```

**Proposed Implementation**:

**Location**: `src/state/feedbackReducer.ts`

```typescript
import { FeedbackState, FeedbackAction } from './types';

export const initialState: FeedbackState = {
  internalIsActive: false,
  hoveredElement: null,
  hoveredComponentInfo: null,
  selectedElement: null,
  // ... all initial state
};

export function feedbackReducer(
  state: FeedbackState,
  action: FeedbackAction
): FeedbackState {
  switch (action.type) {
    case 'SET_IS_ACTIVE':
      return { ...state, internalIsActive: action.payload.internalIsActive };
    // ... all cases
    default:
      return state;
  }
}
```

**Location**: `src/state/types.ts`

```typescript
export interface FeedbackState {
  internalIsActive: boolean;
  hoveredElement: HTMLElement | null;
  hoveredComponentInfo: ComponentInfo | null;
  selectedElement: HTMLElement | null;
  highlightStyle: HighlightStyle | null;
  tooltipStyle: TooltipStyle | null;
  isModalOpen: boolean;
  screenshot: string | null;
  isCapturing: boolean;
  isDashboardOpen: boolean;
  isCanvasActive: boolean;
  isRecordingActive: boolean;
  isRecording: boolean;
  isInitializing: boolean;
  isPaused: boolean;
  videoBlob: Blob | null;
  eventLogs: EventLog[];
  isManualFeedbackOpen: boolean;
  integrationStatus: IntegrationStatusMap;
  lastIntegrationResults: IntegrationResults;
  submissionQueue: SubmissionQueueItem[];
}

export type FeedbackAction =
  | { type: 'SET_IS_ACTIVE'; payload: { internalIsActive: boolean } }
  | { type: 'SET_HOVERED_ELEMENT'; payload: { element: HTMLElement; componentInfo: ComponentInfo | null; highlightStyle: HighlightStyle; tooltipStyle: TooltipStyle } }
  // ... all action types
```

**Acceptance Criteria**:

- [ ] Reducer extracted to separate file
- [ ] All action types properly typed
- [ ] Initial state extracted
- [ ] FeedbackProvider imports from new location
- [ ] No functionality changes
- [ ] Unit tests for all action types

**Testing**:

- [ ] Test each action type
- [ ] Test initial state
- [ ] Test unknown action handling

**Dependencies**: I001

---

### I011 - Create Action Creators

**Status**: ✅ Done
**Priority**: 🟢 High

**Description**:
Create action creator functions for type-safe action dispatching.

**Proposed Implementation**:

**Location**: `src/state/actions.ts`

```typescript
import { FeedbackAction } from './types';

export const actions = {
  setIsActive: (isActive: boolean): FeedbackAction => ({
    type: 'SET_IS_ACTIVE',
    payload: { internalIsActive: isActive },
  }),

  setHoveredElement: (
    element: HTMLElement,
    componentInfo: ComponentInfo | null,
    highlightStyle: HighlightStyle,
    tooltipStyle: TooltipStyle
  ): FeedbackAction => ({
    type: 'SET_HOVERED_ELEMENT',
    payload: { element, componentInfo, highlightStyle, tooltipStyle },
  }),

  captureStart: (): FeedbackAction => ({
    type: 'CAPTURE_START',
  }),

  captureComplete: (screenshot: string): FeedbackAction => ({
    type: 'CAPTURE_COMPLETE',
    payload: screenshot,
  }),

  // ... all action creators
} as const;

export type ActionCreators = typeof actions;
```

**Acceptance Criteria**:

- [ ] Action creator for each action type
- [ ] Properly typed payloads
- [ ] Actions are const typed
- [ ] Components updated to use action creators

**Testing**:

- [ ] Test each action creator
- [ ] Verify type safety

**Dependencies**: I010

---

### I012 - Create Selectors

**Status**: ✅ Done
**Priority**: 🟢 High

**Description**:
Create selector functions for accessing state in a reusable, testable manner.

**Proposed Implementation**:

**Location**: `src/state/selectors.ts`

```typescript
import { FeedbackState } from './types';

// Basic selectors
export const selectIsActive = (state: FeedbackState) => state.internalIsActive;
export const selectIsDashboardOpen = (state: FeedbackState) => state.isDashboardOpen;
export const selectIsRecording = (state: FeedbackState) => state.isRecording;
export const selectIsPaused = (state: FeedbackState) => state.isPaused;
export const selectScreenshot = (state: FeedbackState) => state.screenshot;
export const selectVideoBlob = (state: FeedbackState) => state.videoBlob;
export const selectEventLogs = (state: FeedbackState) => state.eventLogs;

// Derived selectors
export const selectIsCapturing = (state: FeedbackState) =>
  state.isCapturing || state.isRecording;

export const selectCanStartRecording = (state: FeedbackState) =>
  !state.isRecording && !state.isCapturing;

export const selectHoveredElementInfo = (state: FeedbackState) => ({
  element: state.hoveredElement,
  componentInfo: state.hoveredComponentInfo,
  highlightStyle: state.highlightStyle,
  tooltipStyle: state.tooltipStyle,
});

// Integration selectors
export const selectIntegrationStatus = (state: FeedbackState) =>
  state.integrationStatus;

export const selectIsAnyIntegrationLoading = (state: FeedbackState) =>
  state.integrationStatus.jira.loading || state.integrationStatus.sheets.loading;

// Submission queue selectors
export const selectSubmissionQueue = (state: FeedbackState) =>
  state.submissionQueue;

export const selectPendingSubmissions = (state: FeedbackState) =>
  state.submissionQueue.filter(s => s.status === 'pending' || s.status === 'submitting');

export const selectFailedSubmissions = (state: FeedbackState) =>
  state.submissionQueue.filter(s => s.status === 'error');
```

**Acceptance Criteria**:

- [ ] Selector for each major state slice
- [ ] Derived selectors for computed values
- [ ] Pure functions (no side effects)
- [ ] Typed return values
- [ ] Components updated to use selectors

**Testing**:

- [ ] Test each selector with various states
- [ ] Test derived selectors

**Dependencies**: I010

---

### I013 - Implement XState State Machine

**Status**: ✅ Done
**Priority**: 🟢 High

**Implementation Notes**:

- Installed `xstate@5.25.0` and `@xstate/react@6.0.0`
- Created `src/state/feedbackMachine.ts` (533 lines) with XState v5 `setup()` API
- All 23 action types mapped to XState events with corresponding actions
- 21 context properties matching FeedbackState interface
- Created 34 unit tests in `tests/unit/state/feedbackMachine.test.ts`
- Updated `FeedbackProvider.tsx` to use `useMachine()` hook instead of `useReducer()`
- Used flat machine structure for backward compatibility (dispatch = send alias)
- All 58 tests pass, build succeeds
- Research documentation at `docs/research/xstate-v5-integration/README.md`

**Description**:
Implement XState for managing the complex feedback state machine. The current reducer has 25+ action types with complex state transitions that are difficult to reason about. **XState is mandatory** for this refactoring as it provides:

- **Explicit states**: All possible states are defined upfront
- **Guarded transitions**: Invalid state transitions are impossible
- **Devtools visualization**: Visual debugging of state machine
- **Testability**: State machines are inherently testable
- **Documentation**: The machine itself documents the state flow

**Proposed Implementation**:

```typescript
import { createMachine, assign } from 'xstate';

export const feedbackMachine = createMachine({
  id: 'feedback',
  initial: 'idle',
  context: {
    screenshot: null,
    videoBlob: null,
    eventLogs: [],
    selectedElement: null,
    // ... more context
  },
  states: {
    idle: {
      on: {
        ACTIVATE: 'selecting',
        START_RECORDING: 'recording',
        OPEN_DASHBOARD: 'dashboard',
      },
    },
    selecting: {
      on: {
        SELECT_ELEMENT: 'capturing',
        CANCEL: 'idle',
        ESCAPE: 'idle',
      },
    },
    capturing: {
      on: {
        CAPTURE_COMPLETE: 'annotating',
        CAPTURE_ERROR: 'error',
      },
    },
    annotating: {
      on: {
        OPEN_CANVAS: 'canvas',
        SUBMIT: 'submitting',
        CANCEL: 'idle',
      },
    },
    recording: {
      initial: 'active',
      states: {
        active: {
          on: { PAUSE: 'paused', STOP: '#feedback.submitting' },
        },
        paused: {
          on: { RESUME: 'active', STOP: '#feedback.submitting' },
        },
      },
      on: {
        CANCEL: 'idle',
      },
    },
    submitting: {
      on: {
        SUBMIT_SUCCESS: 'idle',
        SUBMIT_ERROR: 'error',
      },
    },
    dashboard: {
      on: {
        CLOSE_DASHBOARD: 'idle',
      },
    },
    error: {
      on: {
        RETRY: 'submitting',
        DISMISS: 'idle',
      },
    },
  },
});
```

**Acceptance Criteria**:

- [x] State machine handles all current states
- [x] State transitions are explicit
- [x] Invalid transitions are prevented
- [ ] Devtools integration for debugging (optional enhancement)
- [x] Existing functionality preserved

**Testing**:

- [x] Test all state transitions
- [x] Test guards and conditions
- [x] Test with XState testing utilities

**Dependencies**: I010-I012

**Notes**:

- XState is a **required** part of this architecture refactoring
- Install with: `npm install xstate @xstate/react`
- Use XState Visualizer during development: <https://stately.ai/viz>
- All hooks (T001-T008) should consume the XState machine context

---

## Dashboard Component Refactoring (Set 5)

### I014 - Extract DashboardContainer Component

**Status**: ✅ Done
**Priority**: 🟡 Medium

**Implementation Notes**:

- Created `src/components/Dashboard/DashboardContainerComponent.tsx`
- Main orchestrator component that manages header, list, and video mode
- Props interface for theme, mode, title, totalCount, isLoading, searchQuery, filterStatus, items, expandedId, isDeveloper, videoModeItem, and callbacks
- Delegates rendering to DashboardHeader, FeedbackList, and VideoMode components
- Commit: f317c26

**Description**:
Extract the main dashboard container/orchestrator from FeedbackDashboard.tsx.

**Acceptance Criteria**:

- [x] Container manages dashboard state
- [x] Delegates to child components
- [x] Handles data loading
- [x] Manages video mode state

**Dependencies**: I005, I010

---

### I015 - Extract DashboardHeader Component

**Status**: ✅ Done
**Priority**: 🟡 Medium

**Implementation Notes**:

- Created `src/components/Dashboard/DashboardHeaderComponent.tsx`
- Full header with title, count badge, search input, status filter dropdown
- Props: title, totalCount, searchQuery, onSearchChange, filterStatus, onFilterChange, statuses, onRefresh, onClose, theme, mode
- Uses styled-components from DashboardStyled.ts
- Commit: f317c26

**Description**:
Extract the dashboard header with title, count badge, search, and filter controls.

**Acceptance Criteria**:

- [x] Displays title and count
- [x] Search input functionality
- [x] Status filter dropdown
- [x] Refresh button
- [x] Close button

**Dependencies**: I014

---

### I016 - Extract FeedbackList Component

**Status**: ✅ Done
**Priority**: 🟡 Medium

**Implementation Notes**:

- Created `src/components/Dashboard/FeedbackListComponent.tsx`
- Renders scrollable list of FeedbackCard components
- Empty state with MessageSquare icon when no items
- Uses ContentArea and EmptyState styled-components
- Commit: f317c26

**Description**:
Extract the feedback items list from FeedbackDashboard.

**Acceptance Criteria**:

- [x] Renders list of FeedbackCard components
- [x] Handles empty state
- [x] Supports expand/collapse
- [x] Manages scroll behavior

**Dependencies**: I014

---

### I017 - Extract FeedbackCard Component

**Status**: ✅ Done
**Priority**: 🟡 Medium

**Implementation Notes**:

- Created `src/components/Dashboard/FeedbackCardComponent.tsx`
- Full props interface with item, isExpanded, onToggleExpand, statusData, statuses, isDeveloper, onStatusChange, onDelete, onOpenVideoMode
- Thumbnail display with screenshot/video support
- StatusBadgeStyled with default values for color props
- Expandable details section with element info and console logs
- Commit: f317c26

**Description**:
Extract individual feedback item card with thumbnail, info, and actions.

**Acceptance Criteria**:

- [x] Displays thumbnail (screenshot/video)
- [x] Shows feedback info
- [x] Status badge
- [x] Expand/collapse for details
- [x] Delete action

**Dependencies**: I016

---

### I018 - Extract VideoMode Component

**Status**: ✅ Done
**Priority**: 🟡 Medium

**Implementation Notes**:

- Created `src/components/Dashboard/VideoModeComponent.tsx`
- Uses createPortal to render to document.body
- Fullscreen video player with synchronized console/network logs panel
- SessionReplayWrapper integration with onTimeUpdate callback
- Exports VideoModeComponent and SessionReplayWrapperProps type
- Commit: f317c26

**Description**:
Extract the fullscreen video playback mode component.

**Acceptance Criteria**:

- [x] Fullscreen video player
- [x] Event logs panel
- [x] Time synchronization
- [x] Close functionality

**Dependencies**: I014

---

### I019 - Extract Dashboard Styled Components

**Status**: ✅ Done
**Priority**: 🟡 Medium

**Implementation Notes**:

- Created `src/components/Dashboard/styled/DashboardStyled.ts`
- Extracted 26 styled-components from FeedbackDashboard.tsx
- Includes: DashboardOverlay, DashboardContainer, Header, TitleContainer, Badge, SearchContainer, etc.
- All components properly typed with ThemeMode and Theme props
- Commit: f317c26

**Description**:
Move all 25+ styled-components from FeedbackDashboard to a dedicated styled file.

**Location**: `src/components/Dashboard/styled/DashboardStyled.ts`

**Acceptance Criteria**:

- [x] All styled-components extracted
- [x] Properly exported
- [x] No duplicate styles
- [x] Theming works correctly

**Dependencies**: I014-I018

---

## Integration System Refactoring (Set 6)

### I020 - Create Base Integration Interface

**Status**: ✅ Done
**Priority**: 🟡 Medium

**Implementation Notes**:

- Created `src/integrations/types.ts` with comprehensive type definitions
- Integration<TConfig, TResult> interface with type, metadata, isConfigured, validateConfig, submit, getConfigModal methods
- ValidationResult with valid flag and ValidationError[] array
- SubmissionResult with success, data, error, issueKey, issueUrl
- SubmissionOptions with retryOnFailure, timeout, additionalMetadata
- ConfigModalProps for modal components
- IntegrationMetadata for display information
- StatusMapping for bidirectional status sync
- Commit: 546da94

**Description**:
Define a base interface that all integrations must implement.

**Location**: `src/integrations/types.ts`

```typescript
export interface Integration<TConfig = unknown, TResult = unknown> {
  readonly type: IntegrationType;
  readonly metadata: IntegrationMetadata;
  isConfigured(): boolean;
  validateConfig(config: TConfig): ValidationResult;
  submit(data: FeedbackData, options?: SubmissionOptions): Promise<SubmissionResult<TResult>>;
  getConfigModal(): React.ComponentType<ConfigModalProps<TConfig>>;
}
```

**Acceptance Criteria**:

- [x] Interface defined with all required methods
- [x] Properly typed with generics
- [x] Documentation comments

**Dependencies**: I001, I004

---

### I021 - Create IntegrationFactory

**Status**: ✅ Done
**Priority**: 🟡 Medium

**Implementation Notes**:

- Created `src/integrations/IntegrationFactory.ts`
- Factory pattern for registering and creating integration instances
- Methods: register(), unregister(), create(), has(), getAvailable(), getMetadata(), getAllMetadata()
- Type-safe with IntegrationConstructor type
- Exports default singleton: integrationFactory
- Commit: 546da94

**Description**:
Create factory for instantiating integrations based on type.

**Location**: `src/integrations/IntegrationFactory.ts`

```typescript
export class IntegrationFactory {
  private constructors: Map<IntegrationType, IntegrationConstructor> = new Map();

  register(type: IntegrationType, constructor: IntegrationConstructor): void;
  unregister(type: IntegrationType): boolean;
  create<TConfig>(type: IntegrationType, config: TConfig): Integration<TConfig>;
  has(type: IntegrationType): boolean;
  getAvailable(): IntegrationType[];
  getMetadata(type: IntegrationType): IntegrationMetadata | undefined;
  getAllMetadata(): Map<IntegrationType, IntegrationMetadata>;
}
```

**Acceptance Criteria**:

- [x] Factory registers integrations
- [x] Factory creates integrations by type
- [x] Extensible for new integrations

**Dependencies**: I020

---

### I022 - Create IntegrationRegistry

**Status**: ✅ Done
**Priority**: 🟡 Medium

**Implementation Notes**:

- Created `src/integrations/IntegrationRegistry.ts`
- Registry pattern for managing configured integration instances
- Methods: add(), remove(), get(), getAll(), setEnabled(), isEnabled(), submit(), submitToAll(), submitTo()
- MultiSubmissionResult type for parallel submissions
- IntegrationState tracking with enabled flag
- Error handling for failed submissions
- Exports default singleton: integrationRegistry
- Commit: 546da94

**Description**:
Create registry for managing configured integrations.

**Acceptance Criteria**:

- [x] Stores configured integrations
- [x] Provides lookup by type
- [x] Manages integration lifecycle

**Dependencies**: I020

---

### I023 - Refactor Jira Integration

**Status**: ✅ Done
**Priority**: 🟡 Medium

**Implementation Notes**:

- Refactored jira.ts (1,062 lines) into modular structure under `src/integrations/jira/`
- Created `JiraIntegration.ts` implementing Integration interface
- Created `JiraClient.ts` for API communication with Atlassian Cloud
- Created `JiraConfigModal.tsx` for configuration UI
- Created `jiraValidation.ts` for config validation
- Created `jiraTypes.ts` for TypeScript types
- Barrel export in `index.ts`
- Commit: 0ed51c7

**Proposed Structure**:

```
src/integrations/jira/
├── JiraIntegration.ts      # Implements Integration interface
├── JiraClient.ts           # API client
├── JiraConfigModal.tsx     # Config UI component
├── jiraValidation.ts       # Validation logic
├── jiraTypes.ts            # TypeScript types
└── index.ts                # Barrel export
```

**Acceptance Criteria**:

- [x] Implements Integration interface
- [x] Separate API client
- [x] Separate validation
- [x] Separate UI component
- [x] All existing functionality preserved

**Dependencies**: I020-I022

---

### I024 - Refactor Sheets Integration

**Status**: ✅ Done
**Priority**: 🟡 Medium

**Implementation Notes**:

- Refactored sheets.ts (1,035 lines) into modular structure under `src/integrations/sheets/`
- Created `SheetsIntegration.ts` implementing Integration interface
- Created `SheetsClient.ts` for Google Sheets API communication
- Created `SheetsConfigModal.tsx` for configuration UI
- Created `sheetsValidation.ts` for config validation
- Created `sheetsTypes.ts` for TypeScript types
- Barrel export in `index.ts`
- Follows same pattern as Jira refactoring
- Commit: 0ed51c7

**Acceptance Criteria**:

- [x] Implements Integration interface
- [x] Separate API client
- [x] Separate validation
- [x] Separate UI component
- [x] All existing functionality preserved

**Dependencies**: I020-I022

---

## Shared Components Extraction (Set 7)

### I025 - Create BaseModal Component

**Status**: ✅ Done
**Priority**: 🟡 Medium

**Implementation Notes**:

- Created `src/components/Modal/BaseModal.tsx` (~320 lines)
- Reusable modal with backdrop, accessibility support
- Close on escape key and backdrop click
- Header/body/footer slots with flexible content
- fadeIn/slideUp animations using keyframes
- Focus trap and ARIA attributes for accessibility
- Barrel export in `src/components/Modal/index.ts`
- Commit: 4ec68f8

**Acceptance Criteria**:

- [x] Backdrop handling
- [x] Close on escape
- [x] Close on backdrop click
- [x] Header/body/footer slots
- [x] Animation support

**Dependencies**: I020

---

### I026 - Create Form Validation Utilities

**Status**: ✅ Done
**Priority**: 🟡 Medium

**Implementation Notes**:

- Extended `src/utils/validation.ts` (~500 lines total, ~350 lines added)
- Generic `ValidationRule<T>` interface for composable rules
- `ValidationSchema<T>` for form-level validation
- Rule factories: `required()`, `email()`, `url()`, `minLength()`, `maxLength()`, `pattern()`, `min()`, `max()`, `custom()`
- `all()` combiner for composing multiple rules
- `validateField()` and `validateForm()` functions
- Full TypeScript typing with generics
- Commit: 4ec68f8

**Acceptance Criteria**:

- [x] Email validation
- [x] URL validation
- [x] Required field validation
- [x] Custom validation support

**Dependencies**: I001

---

### I027 - Create ErrorBoundary Component

**Status**: ✅ Done
**Priority**: 🟡 Medium

**Implementation Notes**:

- Created `src/components/shared/ErrorBoundary.tsx` (~450 lines)
- React class component for catching rendering errors
- Custom fallback UI support via `FallbackProps` interface
- Default styled fallback with error details (dev mode)
- `useErrorHandler` hook for manual error throwing
- `withErrorBoundary` HOC for wrapping components
- Error recovery via `onReset` callback
- Barrel export in `src/components/shared/index.ts`
- Commit: 4ec68f8

**Acceptance Criteria**:

- [x] Catches rendering errors
- [x] Displays fallback UI
- [x] Reports errors
- [x] Recovery option

**Dependencies**: I001

---

### I028 - Create Theme Hooks

**Status**: ✅ Done
**Priority**: 🟡 Medium

**Implementation Notes**:

- Created `src/hooks/useTheme.ts` (~350 lines)
- `useTheme()` - Access full theme from styled-components context
- `useColors()` - Access color palette from theme
- `useFeedbackTheme()` - Access feedback-specific theme values
- `useSystemThemePreference()` - Detect system dark/light mode preference
- Utility functions: `cssVar()`, `cssVarWithFallback()`, `getSystemTheme()`
- Full TypeScript types for theme objects
- Exports added to `src/hooks/index.ts`
- Commit: 4ec68f8

**Acceptance Criteria**:

- [x] useTheme hook
- [x] useColors hook
- [x] useFeedbackTheme hook
- [x] TypeScript types for theme

**Dependencies**: I001

---

## Overlay Components Refactoring (Set 8)

### I029 - Create SelectionOverlay Component

**Status**: ✅ Done
**Priority**: 🔴 Low

**Description**:
Extract selection overlay from FeedbackProvider.

**Implementation Notes**:

- Created `src/components/Overlay/SelectionOverlay.tsx` with full TypeScript types
- Implements portal rendering to document.body
- Supports keyboard events (Escape to cancel)
- Includes helper functions: `calculateHighlightStyle`, `calculateTooltipStyle`, `getComponentInfo`, `shouldIgnoreElement`
- Theme integration via styled-components
- Comprehensive test coverage (21 tests)

**Dependencies**: T005

---

### I030 - Create ElementHighlight Component

**Status**: ✅ Done
**Priority**: 🔴 Low

**Description**:
Extract element highlight from FeedbackProvider.

**Implementation Notes**:

- Created `src/components/Overlay/ElementHighlight.tsx` with full TypeScript types
- Supports variants: hover, selected, error, success
- Supports animations: none, pulse, glow, bounce
- Includes corner markers for enhanced visibility
- Theme integration and custom color overrides
- Comprehensive test coverage (29 tests)

**Dependencies**: T005

---

### I031 - Create ElementTooltip Component

**Status**: ✅ Done
**Priority**: 🔴 Low

**Description**:
Extract element tooltip from FeedbackProvider.

**Implementation Notes**:

- Created `src/components/Overlay/ElementTooltip.tsx` with full TypeScript types
- Displays element info: tagName, componentName, id, classList, dimensions, dataAttributes
- Supports variants: default, dark, light, info, success, warning, error
- Includes `extractElementInfo` helper function
- Theme integration via styled-components
- Comprehensive test coverage (44 tests)

**Dependencies**: T005

---

## Additional Improvements

### I032 - Extract Date Utilities

**Status**: 🔲 TODO
**Priority**: 🔴 Low

**Description**:
Extract date formatting utilities from FeedbackDashboard.

**Dependencies**: I003

---

### I033 - Create Status Registry

**Status**: 🔲 TODO
**Priority**: 🔴 Low

**Description**:
Create registry pattern for extensible status system.

**Dependencies**: I001

---

### I034 - Consolidate Magic Numbers/Strings

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**:
Ensure all magic numbers/strings use constants module.

**Dependencies**: I002

---

### I035 - Reduce FeedbackProvider Complexity

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**:
Final cleanup of FeedbackProvider after all hooks extracted.

**Dependencies**: T001-T008

---

## Summary

| ID   | Title                                    | Priority   | Status     | Set  |
|------|------------------------------------------|------------|------------|------|
| I001 | Create Directory Structure               | 🟢 High    | ✅ Done    | 1    |
| I002 | Extract Constants to Dedicated Module    | 🟢 High    | ✅ Done    | 1    |
| I003 | Extract Utility Functions                | 🟢 High    | ✅ Done    | 1    |
| I004 | Create Service Interfaces                | 🟢 High    | ✅ Done    | 1    |
| I005 | Create StorageService Interface & Impl   | 🟢 High    | ✅ Done    | 2    |
| I006 | Create VideoStorageService (IndexedDB)   | 🟢 High    | ✅ Done    | 2    |
| I007 | Create RecorderService Interface & Impl  | 🟢 High    | ✅ Done    | 2    |
| I008 | Create ScreenshotService Interface       | 🟢 High    | ✅ Done    | 2    |
| I009 | Add Dependency Injection to Provider     | 🟢 High    | ✅ Done    | 2    |
| I010 | Extract Reducer to Separate File         | 🟢 High    | ✅ Done    | 3    |
| I011 | Create Action Creators                   | 🟢 High    | ✅ Done    | 3    |
| I012 | Create Selectors                         | 🟢 High    | ✅ Done    | 3    |
| I013 | Implement XState State Machine           | 🟢 High    | ✅ Done    | 3    |
| I014 | Extract DashboardContainer Component     | 🟡 Medium  | ✅ Done    | 5    |
| I015 | Extract DashboardHeader Component        | 🟡 Medium  | ✅ Done    | 5    |
| I016 | Extract FeedbackList Component           | 🟡 Medium  | ✅ Done    | 5    |
| I017 | Extract FeedbackCard Component           | 🟡 Medium  | ✅ Done    | 5    |
| I018 | Extract VideoMode Component              | 🟡 Medium  | ✅ Done    | 5    |
| I019 | Extract Dashboard Styled Components      | 🟡 Medium  | ✅ Done    | 5    |
| I020 | Create Base Integration Interface        | 🟡 Medium  | ✅ Done    | 6    |
| I021 | Create IntegrationFactory                | 🟡 Medium  | ✅ Done    | 6    |
| I022 | Create IntegrationRegistry               | 🟡 Medium  | ✅ Done    | 6    |
| I023 | Refactor Jira Integration                | 🟡 Medium  | ✅ Done    | 6    |
| I024 | Refactor Sheets Integration              | 🟡 Medium  | ✅ Done    | 6    |
| I025 | Create BaseModal Component               | 🟡 Medium  | ✅ Done    | 7    |
| I026 | Create Form Validation Utilities         | 🟡 Medium  | ✅ Done    | 7    |
| I027 | Create ErrorBoundary Component           | 🟡 Medium  | ✅ Done    | 7    |
| I028 | Create Theme Hooks                       | 🟡 Medium  | ✅ Done    | 7    |
| I029 | Create SelectionOverlay Component        | 🔴 Low     | ✅ Done    | 8    |
| I030 | Create ElementHighlight Component        | 🔴 Low     | ✅ Done    | 8    |
| I031 | Create ElementTooltip Component          | 🔴 Low     | ✅ Done    | 8    |
| I032 | Extract Date Utilities                   | 🔴 Low     | 🔲 TODO    | -    |
| I033 | Create Status Registry                   | 🔴 Low     | 🔲 TODO    | -    |
| I034 | Consolidate Magic Numbers/Strings        | 🟢 High    | 🔲 TODO    | -    |
| I035 | Reduce FeedbackProvider Complexity       | 🟢 High    | 🔲 TODO    | -    |

---

## Related Documents

- [TASKS-OVERVIEW.md](./TASKS-OVERVIEW.md) - Main task overview
- [TASKS-FEATURES.md](./TASKS-FEATURES.md) - Feature tasks (hooks)
- [TASKS-DOCUMENTATION.md](./TASKS-DOCUMENTATION.md) - Documentation tasks
- [Architecture Refactoring Analysis](../architecture-refactoring-analysis.md) - Source specification
