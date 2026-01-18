# Feedback Server WebUI - Tasks Overview

> **Version:** 0.7.0
> **Last Updated:** 2026-01-18

## 📋 Task Summary

| Category       | Total  | Not Started | In Progress | Done   |
| -------------- | ------ | ----------- | ----------- | ------ |
| Setup          | 3      | 0           | 0           | 3      |
| API-First      | 2      | 0           | 0           | 2      |
| Core Pages     | 5      | 0           | 0           | 5      |
| Components     | 8      | 0           | 0           | 8      |
| State & Data   | 4      | 0           | 0           | 4      |
| Real-time      | 3      | 0           | 0           | 3      |
| Authentication | 3      | 0           | 0           | 3      |
| Testing        | 3      | 0           | 0           | 3      |
| **Total**      | **31** | **0**       | **0**       | **31** |

---

## 📦 Category: Setup

### TASK-WUI-001: Initialize Vite React Project

**Priority:** P0 - Critical
**Estimated Effort:** 2 hours
**Status:** ✅ DONE

**Description:**
Create a new Vite project with React and TypeScript template, configure path aliases, and set up base configuration.

**Acceptance Criteria:**

- [ ] Create project with `bun create vite@latest`
- [ ] Configure TypeScript with strict mode
- [ ] Set up path aliases (`@/` for src)
- [ ] Configure Vite for development and production
- [ ] Add `.env.example` with required variables

---

### TASK-WUI-002: Configure Tailwind CSS and shadcn/ui

**Priority:** P0 - Critical
**Estimated Effort:** 2 hours
**Status:** ✅ DONE

**Description:**
Set up Tailwind CSS with custom theme colors and configure shadcn/ui component library.

**Acceptance Criteria:**

- [ ] Install and configure Tailwind CSS
- [ ] Define custom color palette for light/dark themes
- [ ] Initialize shadcn/ui with custom theme
- [ ] Install base components (Button, Card, Input, Dialog)
- [ ] Configure typography plugin

---

### TASK-WUI-003: Set Up Project Structure

**Priority:** P0 - Critical
**Estimated Effort:** 1 hour
**Status:** ✅ DONE

**Description:**
Create folder structure following React best practices.

**Acceptance Criteria:**

- [ ] Create `src/pages/` for page components
- [ ] Create `src/components/` for shared components
- [ ] Create `src/lib/` for utilities and API clients
- [ ] Create `src/hooks/` for custom hooks
- [ ] Create `src/stores/` for Zustand stores

---

## 🔗 Category: API-First Integration

### TASK-WUI-A01: Add @feedback/api-types Dependency

**Priority:** P0 - Critical
**Estimated Effort:** 1 hour
**Status:** ✅ DONE
**Dependencies:** TASK-WUI-001

**Description:**
Add the `@feedback/api-types` workspace dependency to use generated types from the TypeSpec API specification. This ensures type safety and consistency with the API contract.

**Acceptance Criteria:**

- [ ] Add `@feedback/api-types` to package.json dependencies
- [ ] Run `bun install` to update lockfile
- [ ] Verify types are accessible in IDE
- [ ] Create `src/types/api.ts` with re-exports for convenience

**Implementation:**

```json
{
  "dependencies": {
    "@feedback/api-types": "workspace:*"
  }
}
```

```typescript
// src/types/api.ts
export type {
  Feedback,
  FeedbackStatus,
  FeedbackType,
  FeedbackPriority,
  CreateFeedbackRequest,
  UpdateFeedbackRequest,
  FeedbackListResponse,
  FeedbackStats,
  Video,
  VideoStatus,
} from "@feedback/api-types";
```

---

### TASK-WUI-A02: Create Typed API Client

**Priority:** P0 - Critical
**Estimated Effort:** 3 hours
**Status:** ✅ DONE
**Dependencies:** TASK-WUI-A01

**Description:**
Create a fully-typed API client using the generated types. The client should handle authentication, error handling, and provide a clean interface for all API operations.

**Acceptance Criteria:**

- [ ] Create `src/lib/api/client.ts` with typed fetch wrapper
- [ ] Implement authentication header injection
- [ ] Add error handling with typed error responses
- [ ] Create methods for all feedback CRUD operations
- [ ] Create methods for video operations
- [ ] Create methods for stats endpoint
- [ ] Add request/response logging in development mode

**Implementation:**

```typescript
// src/lib/api/client.ts
import type {
  Feedback,
  FeedbackListResponse,
  CreateFeedbackRequest,
  UpdateFeedbackRequest,
  FeedbackStats,
} from "@feedback/api-types";

class FeedbackApiClient {
  constructor(private baseUrl: string) {}

  async listFeedback(params: ListParams): Promise<FeedbackListResponse>;
  async getFeedback(id: string): Promise<Feedback>;
  async createFeedback(data: CreateFeedbackRequest): Promise<Feedback>;
  async updateFeedback(
    id: string,
    data: UpdateFeedbackRequest,
  ): Promise<Feedback>;
  async deleteFeedback(id: string): Promise<void>;
  async getStats(): Promise<FeedbackStats>;
}

export const apiClient = new FeedbackApiClient(import.meta.env.VITE_API_URL);
```

---

## 📄 Category: Core Pages

### TASK-WUI-004: Create Login Page

**Priority:** P0 - Critical
**Estimated Effort:** 4 hours
**Status:** ✅ DONE

**Description:**
Implement login page with email/password form and authentication flow.

**Acceptance Criteria:**

- [ ] Login form with email and password fields
- [ ] Form validation with error messages
- [ ] "Remember me" checkbox
- [ ] Loading state during authentication
- [ ] Redirect to dashboard on success
- [ ] Display error toast on failure

---

### TASK-WUI-005: Create Dashboard Page

**Priority:** P0 - Critical
**Estimated Effort:** 6 hours
**Status:** ✅ DONE

**Description:**
Implement dashboard with statistics cards, chart, and recent feedback list.

**Acceptance Criteria:**

- [ ] Statistics cards (total, pending, bugs, features)
- [ ] Line chart showing feedback over time
- [ ] Recent feedback list (last 10 items)
- [ ] Quick filter buttons
- [ ] Responsive layout

---

### TASK-WUI-006: Create Feedback List Page

**Priority:** P0 - Critical
**Estimated Effort:** 8 hours
**Status:** ✅ DONE

**Description:**
Implement feedback list with filtering, sorting, and pagination.

**Acceptance Criteria:**

- [ ] Data table with sortable columns
- [ ] Filter bar (status, type, priority, date)
- [ ] Search input with debounce
- [ ] Pagination with page size selector
- [ ] Row click navigation to detail
- [ ] Bulk selection and actions

---

### TASK-WUI-007: Create Feedback Detail Page

**Priority:** P0 - Critical
**Estimated Effort:** 10 hours
**Status:** ✅ DONE

**Description:**
Implement feedback detail view with all metadata and media viewers.

**Acceptance Criteria:**

- [ ] Header with title, status, priority
- [ ] Environment metadata display
- [ ] Screenshot viewer with zoom
- [ ] Video player (if video attached)
- [ ] Console logs viewer
- [ ] Network requests viewer
- [ ] Status/priority editor
- [ ] Tag management

---

### TASK-WUI-008: Create Settings Page

**Priority:** P2 - Low
**Estimated Effort:** 6 hours
**Status:** ✅ DONE

**Description:**
Implement settings page for user preferences and project management.

**Acceptance Criteria:**

- [ ] Theme toggle (light/dark/system)
- [ ] Project list (for admins)
- [ ] API key management (for admins)
- [ ] User profile section

---

## 🧩 Category: Components

### TASK-WUI-009: Create Layout Components

**Priority:** P0 - Critical
**Estimated Effort:** 4 hours
**Status:** ✅ DONE

**Description:**
Create main layout components: Header, Sidebar, and page wrapper.

**Acceptance Criteria:**

- [ ] Header with logo, search, user menu
- [ ] Collapsible sidebar with navigation
- [ ] Main content wrapper with proper spacing
- [ ] Mobile-responsive layout

---

### TASK-WUI-010: Create DataTable Component

**Priority:** P0 - Critical
**Estimated Effort:** 6 hours
**Status:** ✅ DONE

**Description:**
Create reusable data table component with sorting, selection, and custom columns.

**Acceptance Criteria:**

- [ ] Column definitions with custom renderers
- [ ] Sortable columns
- [ ] Row selection (single and multi)
- [ ] Loading and empty states
- [ ] Keyboard navigation

---

### TASK-WUI-011: Create FilterBar Component

**Priority:** P1 - High
**Estimated Effort:** 4 hours
**Status:** ✅ DONE

**Description:**
Create filter bar component with multiple filter types.

**Acceptance Criteria:**

- [ ] Select filters (status, type, priority)
- [ ] Date range picker
- [ ] Active filter chips with clear
- [ ] Reset all button

---

### TASK-WUI-012: Create ScreenshotViewer Component

**Priority:** P0 - Critical
**Estimated Effort:** 6 hours
**Status:** ✅ DONE

**Description:**
Create screenshot viewer with zoom, pan, and annotation display.

**Acceptance Criteria:**

- [ ] Zoomable image with scroll wheel
- [ ] Pan when zoomed
- [ ] Annotation overlay display
- [ ] Full-screen mode
- [ ] Multiple screenshot carousel

---

### TASK-WUI-013: Create VideoPlayer Component

**Priority:** P1 - High
**Estimated Effort:** 4 hours
**Status:** ✅ DONE

**Description:**
Create video player for session recordings.

**Acceptance Criteria:**

- [ ] Play/pause controls
- [ ] Progress bar with seek
- [ ] Volume control
- [ ] Fullscreen toggle
- [ ] Playback speed control

---

### TASK-WUI-014: Create ConsoleLogViewer Component

**Priority:** P1 - High
**Estimated Effort:** 4 hours
**Status:** ✅ DONE

**Description:**
Create console log viewer with syntax highlighting and filtering.

**Acceptance Criteria:**

- [ ] Log entries with level icons
- [ ] Syntax highlighting for objects
- [ ] Filter by log level
- [ ] Search within logs
- [ ] Copy to clipboard

---

### TASK-WUI-015: Create NetworkRequestViewer Component

**Priority:** P1 - High
**Estimated Effort:** 4 hours
**Status:** ✅ DONE

**Description:**
Create network request viewer showing captured requests.

**Acceptance Criteria:**

- [ ] Request list with method, URL, status
- [ ] Status color coding
- [ ] Duration display
- [ ] Expandable request/response details
- [ ] Filter by status (success/error)

---

### TASK-WUI-016: Create StatusBadge Component

**Priority:** P0 - Critical
**Estimated Effort:** 1 hour
**Status:** ✅ DONE

**Description:**
Create status badge component with color variants.

**Acceptance Criteria:**

- [ ] Color variants for each status
- [ ] Consistent sizing
- [ ] Optional icon
- [ ] Clickable variant for editing

---

## 🔄 Category: State & Data

### TASK-WUI-017: Set Up Zustand Store

**Priority:** P0 - Critical
**Estimated Effort:** 2 hours
**Status:** ✅ DONE

**Description:**
Create Zustand store for UI state and preferences.

**Acceptance Criteria:**

- [x] Theme state with persistence
- [x] Sidebar toggle state
- [x] Notification queue
- [x] WebSocket connection state

**Implementation:**

- Created `src/stores/ui.ts` with comprehensive UI state management
- Implemented theme persistence with localStorage and system preference sync
- Added notification queue with auto-dismiss timers
- Added WebSocket connection state tracking
- Exported selectors and utility functions

---

### TASK-WUI-018: Set Up React Query

**Priority:** P0 - Critical
**Estimated Effort:** 3 hours
**Status:** ✅ DONE

**Description:**
Configure React Query with API client and default options.

**Acceptance Criteria:**

- [x] Query client with defaults
- [x] Error handling
- [x] Retry configuration
- [x] Devtools in development

**Implementation:**

- Enhanced `main.tsx` with QueryClient configuration
- Configured smart retry (no retry on 4xx, exponential backoff)
- Added stale time and refetch settings
- Added ReactQueryDevtools for development debugging

---

### TASK-WUI-019: Create API Client

**Priority:** P0 - Critical
**Estimated Effort:** 4 hours
**Status:** ✅ DONE

**Description:**
Create typed API client using Hono RPC or fetch with types.

**Acceptance Criteria:**

- [x] Typed request/response
- [x] Token injection interceptor
- [x] Error transformation
- [x] Request/response logging in dev

**Implementation:**

- Created `src/lib/api/client.ts` with typed FeedbackAPI client
- Uses @feedback/api-types for type safety
- Includes ApiError class for consistent error handling
- Token interceptor ready for authentication integration

---

### TASK-WUI-020: Create React Query Hooks

**Priority:** P0 - Critical
**Estimated Effort:** 4 hours
**Status:** ✅ DONE

**Description:**
Create custom hooks for data fetching with React Query.

**Acceptance Criteria:**

- [x] `useFeedbackList` with filters
- [x] `useFeedback` for single item
- [x] `useStats` for dashboard
- [x] `useUpdateFeedback` mutation
- [x] `useDeleteFeedback` mutation

**Implementation:**

- Created `src/hooks/useFeedback.ts` with all React Query hooks
- Includes optimistic updates for mutations
- Automatic cache invalidation on success
- Toast notifications integrated via useNotifications store
- Prefetch helpers for link hover optimization
- Query key factory for cache management

---

## 🔌 Category: Real-time

### TASK-WUI-021: Create WebSocket Client

**Priority:** P1 - High
**Estimated Effort:** 4 hours
**Status:** ✅ COMPLETE

**Description:**
Create WebSocket client for real-time updates.

**Acceptance Criteria:**

- [x] Connection management (connect/disconnect)
- [x] Auto-reconnect with backoff
- [x] Event subscription/unsubscription
- [x] Connection status tracking

**Notes:** Implemented via spec 005 (TASK-WWS-003, TASK-WWS-004, TASK-WWS-005, TASK-WWS-006)

---

### TASK-WUI-022: Integrate WebSocket with Store

**Priority:** P1 - High
**Estimated Effort:** 3 hours
**Status:** ✅ COMPLETE

**Description:**
Connect WebSocket events to Zustand store and React Query cache.

**Acceptance Criteria:**

- [x] Update query cache on events
- [x] Add notifications on new feedback
- [x] Handle connection status changes
- [x] Reconnect on window focus

**Notes:** Implemented via spec 005 (TASK-WWS-007, TASK-WWS-008)

---

### TASK-WUI-023: Create Toast Notifications

**Priority:** P1 - High
**Estimated Effort:** 2 hours
**Status:** ✅ COMPLETE

**Description:**
Implement toast notification system for real-time updates and actions.

**Acceptance Criteria:**

- [x] Toast component with variants (success, error, warning, info)
- [x] Auto-dismiss with configurable duration
- [x] Action button support
- [x] Stack management

**Implementation:**

- Created `src/components/Toast.tsx` with Toast, ToastContainer, and useToast hook
- Added CSS animations for slide-in and progress bar
- 25 unit tests passing

---

## 🔐 Category: Authentication

### TASK-WUI-024: Create Auth Context

**Priority:** P0 - Critical
**Estimated Effort:** 3 hours
**Status:** ✅ COMPLETE

**Description:**
Create authentication context with user state and methods.

**Acceptance Criteria:**

- [x] User state (logged in, user info, role)
- [x] Login/logout methods
- [x] Token refresh logic
- [x] Auth persistence

**Implementation:**

- Enhanced `src/stores/auth.ts` with full auth features:
  - API key and JWT authentication support
  - User roles (admin, user, viewer) with hierarchy
  - Token expiry checking with 5-minute buffer
  - `useAuth()` hook for easy consumption
  - `useRequireRole()` hook for role-based access
  - Auto-logout on token expiry during rehydration
- 29 unit tests passing

---

### TASK-WUI-025: Create Protected Route Wrapper

**Priority:** P0 - Critical
**Estimated Effort:** 2 hours
**Status:** ✅ COMPLETE

**Description:**
Create route wrapper that redirects unauthenticated users.

**Acceptance Criteria:**

- [x] Redirect to login if not authenticated
- [x] Loading state while checking auth
- [x] Role-based route protection
- [x] Remember intended destination

**Implementation:**

- Enhanced `ProtectedRoute` in `src/App.tsx`:
  - Loading screen during auth state restoration
  - Redirect to login when unauthenticated
  - Role-based access control with `requiredRole` prop
  - Access denied screen for insufficient permissions
  - Settings page restricted to admin role

**Acceptance Criteria:**

- [x] Redirect to login if not authenticated
- [x] Loading state while checking auth
- [x] Role-based route protection
- [x] Remember intended destination

---

### TASK-WUI-026: Implement Logout Flow

**Priority:** P0 - Critical
**Estimated Effort:** 1 hour
**Status:** ✅ COMPLETE

**Description:**
Implement logout with cleanup and redirect.

**Acceptance Criteria:**

- [x] Clear tokens and user state
- [x] Disconnect WebSocket
- [x] Clear query cache
- [x] Redirect to login

**Implementation:**

- Created `src/hooks/useLogout.ts`:
  - `useLogout()` hook for complete logout flow
  - `useLogoutWithNotification()` convenience wrapper
  - Clears WebSocket status, React Query cache, notifications, and auth state
  - Configurable redirect path and notification message
- Updated `src/components/Layout.tsx` to use new hook
- 10 unit tests passing

---

## 🧪 Category: Testing

### TASK-WUI-027: Set Up Vitest

**Priority:** P1 - High
**Estimated Effort:** 2 hours
**Status:** ✅ COMPLETE

**Description:**
Configure Vitest for component and hook testing.

**Acceptance Criteria:**

- [x] Vitest configuration
- [x] Testing Library setup
- [x] Mock service worker for API (installed, handlers in TASK-WUI-028)
- [x] Coverage configuration

**Implementation:**

- `vitest.config.ts` with jsdom, React plugin, path aliases
- `tests/setup.ts` with comprehensive utilities (375 lines)
- MSW v2.12.7 installed
- @testing-library/react 16.3.0 installed
- V8 coverage provider configured
- 192 tests currently passing

---

### TASK-WUI-028: Write Component Tests

**Priority:** P1 - High
**Estimated Effort:** 8 hours
**Status:** ✅ COMPLETE

**Description:**
Write unit tests for key components.

**Acceptance Criteria:**

- [x] StatusBadge tests (42 tests)
- [x] DataTable tests (36 tests)
- [x] FilterBar tests (26 tests)
- [x] ScreenshotViewer tests (43 tests)
- [x] Layout component tests (24 tests)

**Progress:**

- Total component tests: 171 tests (5 of 5 components complete)
- Overall WebUI tests: 363 tests passing

---

### TASK-WUI-029: Set Up Playwright E2E Tests

**Priority:** P2 - Low
**Estimated Effort:** 6 hours
**Status:** ✅ COMPLETE

**Description:**
Configure Playwright and write E2E test suite.

**Acceptance Criteria:**

- [x] Playwright configuration (`playwright.config.ts`)
- [x] Login flow test (`auth.spec.ts`)
- [x] Dashboard navigation test (`dashboard.spec.ts`)
- [x] Feedback list interaction test (`feedback-list.spec.ts`)
- [x] Detail page test (`feedback-detail.spec.ts`)

**Implementation:**

- `playwright.config.ts` with multi-browser setup (Chromium, Firefox, WebKit, Mobile)
- `tests/e2e/fixtures.ts` with custom fixtures and helper functions
- 4 E2E test files covering authentication, navigation, and feedback CRUD
- Scripts: `test:e2e`, `test:e2e:ui`, `test:e2e:headed`, `test:e2e:debug`

---

## 📅 Phased Execution Plan

### Phase 1: Foundation (Week 1-2)

1. TASK-WUI-001: Initialize Vite React Project
2. TASK-WUI-002: Configure Tailwind CSS and shadcn/ui
3. TASK-WUI-003: Set Up Project Structure
4. TASK-WUI-017: Set Up Zustand Store
5. TASK-WUI-018: Set Up React Query
6. TASK-WUI-019: Create API Client

### Phase 2: Authentication (Week 2-3)

7. TASK-WUI-024: Create Auth Context
8. TASK-WUI-025: Create Protected Route Wrapper
9. TASK-WUI-004: Create Login Page
10. TASK-WUI-026: Implement Logout Flow

### Phase 3: Core Pages (Week 3-5)

11. TASK-WUI-009: Create Layout Components
12. TASK-WUI-016: Create StatusBadge Component
13. TASK-WUI-020: Create React Query Hooks
14. TASK-WUI-005: Create Dashboard Page
15. TASK-WUI-010: Create DataTable Component
16. TASK-WUI-011: Create FilterBar Component
17. TASK-WUI-006: Create Feedback List Page

### Phase 4: Detail View (Week 5-7)

18. TASK-WUI-012: Create ScreenshotViewer Component
19. TASK-WUI-013: Create VideoPlayer Component
20. TASK-WUI-014: Create ConsoleLogViewer Component
21. TASK-WUI-015: Create NetworkRequestViewer Component
22. TASK-WUI-007: Create Feedback Detail Page

### Phase 5: Real-time (Week 7-8)

23. TASK-WUI-021: Create WebSocket Client
24. TASK-WUI-022: Integrate WebSocket with Store
25. TASK-WUI-023: Create Toast Notifications

### Phase 6: Polish & Testing (Week 8-10)

26. TASK-WUI-008: Create Settings Page
27. TASK-WUI-027: Set Up Vitest
28. TASK-WUI-028: Write Component Tests
29. TASK-WUI-029: Set Up Playwright E2E Tests

---

**Document Status:** Draft
**Author:** GitHub Copilot
**Created:** January 2025
