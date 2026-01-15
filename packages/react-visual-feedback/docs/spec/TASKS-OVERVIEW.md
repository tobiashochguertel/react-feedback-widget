# React Visual Feedback - Architecture Refactoring Tasks

**Created:** 2026-01-15
**Updated:** 2026-01-15
**Status:** Planning
**Specification Source:** [architecture-refactoring-analysis.md](../architecture-refactoring-analysis.md)

> This document tracks all tasks required to refactor the react-visual-feedback codebase following SOLID principles and addressing identified code smells. Tasks are organized by category and tracked with simple status indicators.

---

## Generation Strategy

**Estimated Tasks**: ~48 tasks
**Chosen Strategy**: Multi-Document Approach
**Files Generated**:

1. `TASKS-OVERVIEW.md` (this file)
2. [TASKS-FEATURES.md](./TASKS-FEATURES.md) - Custom hooks extraction
3. [TASKS-IMPROVEMENTS.md](./TASKS-IMPROVEMENTS.md) - Refactoring and architectural improvements
4. [TASKS-DOCUMENTATION.md](./TASKS-DOCUMENTATION.md) - Documentation tasks

---

## Quick Status Overview

| Category       | Total | Done | In Progress | TODO | Paused |
|----------------|-------|------|-------------|------|--------|
| Fixes          | 0     | 0    | 0           | 0    | 0      |
| Features       | 8     | 0    | 0           | 8    | 0      |
| Improvements   | 35    | 0    | 0           | 35   | 0      |
| Documentation  | 5     | 0    | 0           | 5    | 0      |
| **TOTAL**      | **48**| **0**| **0**       | **48**| **0** |

---

## Table of Contents

- [React Visual Feedback - Architecture Refactoring Tasks](#react-visual-feedback---architecture-refactoring-tasks)
  - [Generation Strategy](#generation-strategy)
  - [Quick Status Overview](#quick-status-overview)
  - [Table of Contents](#table-of-contents)
  - [Task Sets](#task-sets)
    - [Set 1: Foundation Setup](#set-1-foundation-setup)
    - [Set 2: Service Layer Extraction](#set-2-service-layer-extraction)
    - [Set 3: State Management Refactoring](#set-3-state-management-refactoring)
    - [Set 4: Custom Hooks Extraction](#set-4-custom-hooks-extraction)
    - [Set 5: Dashboard Component Refactoring](#set-5-dashboard-component-refactoring)
    - [Set 6: Integration System Refactoring](#set-6-integration-system-refactoring)
    - [Set 7: Shared Components Extraction](#set-7-shared-components-extraction)
    - [Set 8: Overlay Components Refactoring](#set-8-overlay-components-refactoring)
    - [Set 9: Documentation](#set-9-documentation)
  - [Task Summary](#task-summary)
  - [Testing Notes](#testing-notes)
    - [Unit Testing Strategy](#unit-testing-strategy)
    - [Integration Testing Strategy](#integration-testing-strategy)
    - [Test Coverage Targets](#test-coverage-targets)
  - [Implementation Notes](#implementation-notes)
    - [Architectural Decisions](#architectural-decisions)
    - [Recommended Implementation Order](#recommended-implementation-order)
    - [Breaking Changes](#breaking-changes)
    - [Migration Strategy](#migration-strategy)
  - [Related Documents](#related-documents)

---

## Task Sets

### Set 1: Foundation Setup

**Priority**: 🟢 High
**Description**: Create the foundational directory structure, extract constants, and define service interfaces. This is the prerequisite for all subsequent refactoring work.

| Order | Task ID | Title                                    | Status     |
|-------|---------|------------------------------------------|------------|
| 1     | I001    | Create Directory Structure               | 🔲 TODO    |
| 2     | I002    | Extract Constants to Dedicated Module    | 🔲 TODO    |
| 3     | I003    | Extract Utility Functions                | 🔲 TODO    |
| 4     | I004    | Create Service Interfaces                | 🔲 TODO    |

**Dependencies**: None (Foundation set)
**Notes**: All subsequent task sets depend on this foundation being in place.

---

### Set 2: Service Layer Extraction

**Priority**: 🟢 High
**Description**: Extract storage, recorder, and screenshot services following the Dependency Inversion Principle. Create abstractions that allow for testable, injectable services.

| Order | Task ID | Title                                    | Status     |
|-------|---------|------------------------------------------|------------|
| 1     | I005    | Create StorageService Interface & Impl   | 🔲 TODO    |
| 2     | I006    | Create VideoStorageService (IndexedDB)   | 🔲 TODO    |
| 3     | I007    | Create RecorderService Interface & Impl  | 🔲 TODO    |
| 4     | I008    | Create ScreenshotService Interface       | 🔲 TODO    |
| 5     | I009    | Add Dependency Injection to Provider     | 🔲 TODO    |

**Dependencies**: Set 1 (Foundation Setup)
**Notes**: In-memory implementations should be created for testing purposes.

---

### Set 3: State Management Refactoring with XState

**Priority**: 🟢 High
**Description**: Refactor the complex reducer in FeedbackProvider by migrating to XState state machine. The current 25+ action types with complex nested conditions are a clear signal that a proper state machine is needed. XState provides explicit state transitions, prevents invalid states, and enables visual debugging.

| Order | Task ID | Title                                    | Status     |
|-------|---------|------------------------------------------|-----------|
| 1     | I010    | Extract Reducer to Separate File         | 🔲 TODO    |
| 2     | I011    | Create Action Creators                   | 🔲 TODO    |
| 3     | I012    | Create Selectors                         | 🔲 TODO    |
| 4     | I013    | Implement XState State Machine           | 🔲 TODO    |

**Dependencies**: Set 1 (Foundation Setup)
**Notes**:

- **XState is mandatory** for this refactoring. The current reducer complexity justifies proper state machine implementation.
- XState will provide: explicit states, guarded transitions, devtools visualization, and testable state machines.

---

### Set 4: Custom Hooks Extraction

**Priority**: 🟢 High
**Description**: Split the massive FeedbackProvider into focused, single-responsibility hooks following the Interface Segregation Principle. Each hook should return only what its consumers need.

| Order | Task ID | Title                                    | Status     |
|-------|---------|------------------------------------------|------------|
| 1     | T001    | Create useActivation Hook                | 🔲 TODO    |
| 2     | T002    | Create useDashboard Hook                 | 🔲 TODO    |
| 3     | T003    | Create useRecording Hook                 | 🔲 TODO    |
| 4     | T004    | Create useScreenCapture Hook             | 🔲 TODO    |
| 5     | T005    | Create useElementSelection Hook          | 🔲 TODO    |
| 6     | T006    | Create useKeyboardShortcuts Hook         | 🔲 TODO    |
| 7     | T007    | Create useFeedbackSubmission Hook        | 🔲 TODO    |
| 8     | T008    | Create useIntegrations Hook              | 🔲 TODO    |

**Dependencies**: Set 3 (State Management Refactoring)
**Notes**: Currently useFeedback returns 10+ values but most consumers only need 1-2.

---

### Set 5: Dashboard Component Refactoring

**Priority**: 🟡 Medium
**Description**: Split the 1,158-line FeedbackDashboard.tsx into smaller, focused components following the Single Responsibility Principle.

| Order | Task ID | Title                                    | Status     |
|-------|---------|------------------------------------------|------------|
| 1     | I014    | Extract DashboardContainer Component     | 🔲 TODO    |
| 2     | I015    | Extract DashboardHeader Component        | 🔲 TODO    |
| 3     | I016    | Extract FeedbackList Component           | 🔲 TODO    |
| 4     | I017    | Extract FeedbackCard Component           | 🔲 TODO    |
| 5     | I018    | Extract VideoMode Component              | 🔲 TODO    |
| 6     | I019    | Extract Dashboard Styled Components      | 🔲 TODO    |

**Dependencies**: Set 2 (Service Layer Extraction), Set 3 (State Management)
**Notes**: FeedbackDashboard currently has 59 symbols and handles IndexedDB, localStorage, date formatting, status management, session replay, video mode UI, and dashboard UI.

---

### Set 6: Integration System Refactoring

**Priority**: 🟡 Medium
**Description**: Refactor the integration system to use the Open/Closed Principle with a factory/registry pattern. Address code duplication between jira.ts (1,062 lines) and sheets.ts (1,035 lines).

| Order | Task ID | Title                                    | Status     |
|-------|---------|------------------------------------------|------------|
| 1     | I020    | Create Base Integration Interface        | 🔲 TODO    |
| 2     | I021    | Create IntegrationFactory                | 🔲 TODO    |
| 3     | I022    | Create IntegrationRegistry               | 🔲 TODO    |
| 4     | I023    | Refactor Jira Integration                | 🔲 TODO    |
| 5     | I024    | Refactor Sheets Integration              | 🔲 TODO    |

**Dependencies**: Set 1 (Foundation Setup)
**Notes**: jira.ts and sheets.ts have nearly identical structure - significant code duplication opportunity.

---

### Set 7: Shared Components Extraction

**Priority**: 🟡 Medium
**Description**: Create reusable base components to eliminate code duplication across modal styling, form validation, and error handling.

| Order | Task ID | Title                                    | Status     |
|-------|---------|------------------------------------------|------------|
| 1     | I025    | Create BaseModal Component               | 🔲 TODO    |
| 2     | I026    | Create Form Validation Utilities         | 🔲 TODO    |
| 3     | I027    | Create ErrorBoundary Component           | 🔲 TODO    |
| 4     | I028    | Create Theme Hooks                       | 🔲 TODO    |

**Dependencies**: Set 6 (Integration System Refactoring)
**Notes**: Modal styling is duplicated in jira.ts, sheets.ts, and FeedbackModal.tsx.

---

### Set 8: Overlay Components Refactoring

**Priority**: 🔴 Low
**Description**: Extract and organize overlay-related components from FeedbackProvider.

| Order | Task ID | Title                                    | Status     |
|-------|---------|------------------------------------------|------------|
| 1     | I029    | Create SelectionOverlay Component        | 🔲 TODO    |
| 2     | I030    | Create ElementHighlight Component        | 🔲 TODO    |
| 3     | I031    | Create ElementTooltip Component          | 🔲 TODO    |

**Dependencies**: Set 4 (Custom Hooks Extraction)
**Notes**: These components are currently embedded within FeedbackProvider.

---

### Set 9: Documentation

**Priority**: 🟡 Medium
**Description**: Create and update documentation for the refactored architecture.

| Order | Task ID | Title                                    | Status     |
|-------|---------|------------------------------------------|------------|
| 1     | D001    | Update Architecture Documentation        | 🔲 TODO    |
| 2     | D002    | Create Service Layer Documentation       | 🔲 TODO    |
| 3     | D003    | Create Hooks API Documentation           | 🔲 TODO    |
| 4     | D004    | Create Integration Guide                 | 🔲 TODO    |
| 5     | D005    | Update README with New Architecture      | 🔲 TODO    |

**Dependencies**: All refactoring tasks complete
**Notes**: Documentation should be updated incrementally as refactoring progresses.

---

## Task Summary

| ID   | Category    | Title                                    | Priority   | Status     | Dependencies     |
|------|-------------|------------------------------------------|------------|------------|------------------|
| I001 | Improvement | Create Directory Structure               | 🟢 High    | 🔲 TODO    | -                |
| I002 | Improvement | Extract Constants to Dedicated Module    | 🟢 High    | 🔲 TODO    | I001             |
| I003 | Improvement | Extract Utility Functions                | 🟢 High    | 🔲 TODO    | I001             |
| I004 | Improvement | Create Service Interfaces                | 🟢 High    | 🔲 TODO    | I001             |
| I005 | Improvement | Create StorageService Interface & Impl   | 🟢 High    | 🔲 TODO    | I001, I004       |
| I006 | Improvement | Create VideoStorageService (IndexedDB)   | 🟢 High    | 🔲 TODO    | I005             |
| I007 | Improvement | Create RecorderService Interface & Impl  | 🟢 High    | 🔲 TODO    | I001, I004       |
| I008 | Improvement | Create ScreenshotService Interface       | 🟢 High    | 🔲 TODO    | I001, I004       |
| I009 | Improvement | Add Dependency Injection to Provider     | 🟢 High    | 🔲 TODO    | I005-I008        |
| I010 | Improvement | Extract Reducer to Separate File         | 🟢 High    | 🔲 TODO    | I001             |
| I011 | Improvement | Create Action Creators                   | 🟢 High    | 🔲 TODO    | I010             |
| I012 | Improvement | Create Selectors                         | 🟢 High    | 🔲 TODO    | I010             |
| I013 | Improvement | Implement XState State Machine           | 🟢 High    | 🔲 TODO    | I010-I012        |
| I014 | Improvement | Extract DashboardContainer Component     | 🟡 Medium  | 🔲 TODO    | I005, I010       |
| I015 | Improvement | Extract DashboardHeader Component        | 🟡 Medium  | 🔲 TODO    | I014             |
| I016 | Improvement | Extract FeedbackList Component           | 🟡 Medium  | 🔲 TODO    | I014             |
| I017 | Improvement | Extract FeedbackCard Component           | 🟡 Medium  | 🔲 TODO    | I016             |
| I018 | Improvement | Extract VideoMode Component              | 🟡 Medium  | 🔲 TODO    | I014             |
| I019 | Improvement | Extract Dashboard Styled Components      | 🟡 Medium  | 🔲 TODO    | I014-I018        |
| I020 | Improvement | Create Base Integration Interface        | 🟡 Medium  | 🔲 TODO    | I001, I004       |
| I021 | Improvement | Create IntegrationFactory                | 🟡 Medium  | 🔲 TODO    | I020             |
| I022 | Improvement | Create IntegrationRegistry               | 🟡 Medium  | 🔲 TODO    | I020             |
| I023 | Improvement | Refactor Jira Integration                | 🟡 Medium  | 🔲 TODO    | I020-I022        |
| I024 | Improvement | Refactor Sheets Integration              | 🟡 Medium  | 🔲 TODO    | I020-I022        |
| I025 | Improvement | Create BaseModal Component               | 🟡 Medium  | 🔲 TODO    | I020             |
| I026 | Improvement | Create Form Validation Utilities         | 🟡 Medium  | 🔲 TODO    | I001             |
| I027 | Improvement | Create ErrorBoundary Component           | 🟡 Medium  | 🔲 TODO    | I001             |
| I028 | Improvement | Create Theme Hooks                       | 🟡 Medium  | 🔲 TODO    | I001             |
| I029 | Improvement | Create SelectionOverlay Component        | 🔴 Low     | 🔲 TODO    | T005             |
| I030 | Improvement | Create ElementHighlight Component        | 🔴 Low     | 🔲 TODO    | T005             |
| I031 | Improvement | Create ElementTooltip Component          | 🔴 Low     | 🔲 TODO    | T005             |
| I032 | Improvement | Extract Date Utilities                   | 🔴 Low     | 🔲 TODO    | I003             |
| I033 | Improvement | Create Status Registry                   | 🔴 Low     | 🔲 TODO    | I001             |
| I034 | Improvement | Consolidate Magic Numbers/Strings        | 🟢 High    | 🔲 TODO    | I002             |
| I035 | Improvement | Reduce FeedbackProvider Complexity       | 🟢 High    | 🔲 TODO    | T001-T008        |
| T001 | Feature     | Create useActivation Hook                | 🟢 High    | 🔲 TODO    | I010             |
| T002 | Feature     | Create useDashboard Hook                 | 🟢 High    | 🔲 TODO    | I010             |
| T003 | Feature     | Create useRecording Hook                 | 🟢 High    | 🔲 TODO    | I010, I007       |
| T004 | Feature     | Create useScreenCapture Hook             | 🟢 High    | 🔲 TODO    | I010, I008       |
| T005 | Feature     | Create useElementSelection Hook          | 🟢 High    | 🔲 TODO    | I010             |
| T006 | Feature     | Create useKeyboardShortcuts Hook         | 🟡 Medium  | 🔲 TODO    | I010             |
| T007 | Feature     | Create useFeedbackSubmission Hook        | 🟢 High    | 🔲 TODO    | I010             |
| T008 | Feature     | Create useIntegrations Hook              | 🟢 High    | 🔲 TODO    | I010, I020       |
| D001 | Documentation | Update Architecture Documentation      | 🟡 Medium  | 🔲 TODO    | All I### tasks   |
| D002 | Documentation | Create Service Layer Documentation     | 🟡 Medium  | 🔲 TODO    | Set 2            |
| D003 | Documentation | Create Hooks API Documentation         | 🟡 Medium  | 🔲 TODO    | Set 4            |
| D004 | Documentation | Create Integration Guide               | 🟡 Medium  | 🔲 TODO    | Set 6            |
| D005 | Documentation | Update README with New Architecture    | 🟡 Medium  | 🔲 TODO    | D001-D004        |

---

## Testing Notes

### Unit Testing Strategy

- **Services**: Create in-memory implementations for all services (StorageService, RecorderService, ScreenshotService) to enable pure unit testing
- **Hooks**: Test each hook in isolation using `@testing-library/react-hooks`
- **Components**: Use React Testing Library for component testing
- **Reducers**: Pure function testing with various action types

### Integration Testing Strategy

- Test service integration with actual browser APIs (IndexedDB, localStorage)
- Test hook combinations that work together
- Test integration submission flows

### Test Coverage Targets

- Core services: 90%+
- Hooks: 80%+
- Components: 75%+
- Integrations: 80%+

---

## Implementation Notes

### Architectural Decisions

1. **Dependency Injection**: Use React Context for DI, allowing easy testing with mock implementations
2. **Service Abstractions**: All browser APIs (localStorage, IndexedDB, MediaRecorder) wrapped in services
3. **State Machine**: **XState is mandatory** for FeedbackProvider's complex state (25+ action types). The explicit state transitions, guards, and devtools support make it the right choice for this complexity level.
4. **Factory Pattern**: Use IntegrationFactory for extensible integration system
5. **Registry Pattern**: Use StatusRegistry for configurable status system

### Recommended Implementation Order

1. **Foundation First**: Complete Set 1 before any other work
2. **Services Before Hooks**: Set 2 enables testable hooks in Set 4
3. **State Before Components**: Set 3 simplifies component refactoring
4. **Parallel Work**: Sets 5, 6, 7 can be worked on in parallel after Sets 1-4

### Breaking Changes

- `useFeedback` hook API will change (split into multiple hooks)
- Integration configuration may change with factory pattern
- Component imports will change with new directory structure

### Migration Strategy

1. Create new implementations alongside existing code
2. Add deprecation warnings to old APIs
3. Update consuming code to use new APIs
4. Remove deprecated code

---

## Related Documents

- [Architecture Refactoring Analysis](../architecture-refactoring-analysis.md) - Source specification
- [TASKS-FEATURES.md](./TASKS-FEATURES.md) - Detailed feature tasks (hooks)
- [TASKS-IMPROVEMENTS.md](./TASKS-IMPROVEMENTS.md) - Detailed improvement tasks
- [TASKS-DOCUMENTATION.md](./TASKS-DOCUMENTATION.md) - Documentation tasks
