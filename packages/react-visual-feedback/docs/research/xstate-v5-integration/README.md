# XState v5 Integration Research

Research documentation for implementing XState v5 state machine in the react-visual-feedback widget.

## 📁 Research Documents

### Overview & Summary

- **[00-overview.md](00-overview.md)** - Executive summary and implementation plan

### Implementation Guide

- **[01-state-machine-design.md](01-state-machine-design.md)** - State machine architecture and design

## 🎯 Quick Findings

### TL;DR: XState v5 `setup()` API with `useMachine` hook ✅

XState v5 provides a modern, type-safe state machine implementation that will:

- Replace the current `useReducer` pattern in FeedbackProvider
- Provide explicit state modeling with hierarchical states
- Enable better action/effect management with built-in side effect handling
- Improve testability with pure state transitions

### Key Implementation Decisions

| Decision         | Choice                     | Rationale                     |
| ---------------- | -------------------------- | ----------------------------- |
| **Package**      | `xstate` + `@xstate/react` | Official packages, v5 latest  |
| **API**          | `setup().createMachine()`  | Type-safe, modern approach    |
| **React Hook**   | `useMachine()`             | Full state + send + actorRef  |
| **State Design** | Hierarchical states        | Match current workflow phases |

## 🔍 Research Methodology

### Data Sources

- [XState v5 Documentation](https://stately.ai/docs) (Accessed: 2026-01-15)
- [XState v5 Migration Guide](https://stately.ai/docs/migration) (Accessed: 2026-01-15)
- [XState Store v3 Blog](https://stately.ai/blog/2024-03-21-xstate-store-v3) (Accessed: 2026-01-15)
- [XState GitHub Repository](https://github.com/statelyai/xstate) (Accessed: 2026-01-15)
- [XState React Package](https://stately.ai/docs/xstate-react) (Accessed: 2026-01-15)
- Context7 XState Documentation

### Criteria Evaluated

1. **API Compatibility** - XState v5 vs v4 changes
2. **TypeScript Support** - Type-safe state machine definitions
3. **React Integration** - `useMachine`, `useActor`, `useSelector` hooks
4. **Side Effect Handling** - Actions, invoked services, guards
5. **Testing** - Pure transition functions, snapshot testing

## 📊 Current State Analysis

### Existing Architecture

The feedback widget currently uses:

- `useReducer` with 23 action types
- Manual side effect management in callbacks
- Implicit state transitions (boolean flags)

### State Flags to Model

| Flag                   | Purpose                 | Target State                    |
| ---------------------- | ----------------------- | ------------------------------- |
| `internalIsActive`     | Widget activation       | `active` vs `inactive`          |
| `isCapturing`          | Screenshot in progress  | `active.capturing`              |
| `isRecording`          | Screen recording active | `active.recording.active`       |
| `isInitializing`       | Recording starting      | `active.recording.initializing` |
| `isPaused`             | Recording paused        | `active.recording.paused`       |
| `isModalOpen`          | Modal visible           | `active.modal`                  |
| `isDashboardOpen`      | Dashboard visible       | `active.dashboard`              |
| `isManualFeedbackOpen` | Manual feedback mode    | `active.modal.manual`           |

### Proposed State Hierarchy

```
feedbackMachine
├── inactive
└── active
    ├── idle (hovering/browsing)
    ├── capturing
    │   └── (invokes screenshot service)
    ├── recording
    │   ├── initializing
    │   ├── active
    │   └── paused
    ├── modal
    │   ├── screenshot
    │   ├── video
    │   └── manual
    └── dashboard
```

## 🎓 Implementation Plan

### Phase 1: Install Dependencies

```bash
bun add xstate @xstate/react
```

### Phase 2: Create State Machine (I013a)

Create `src/state/feedbackMachine.ts`:

- Define context type (matches current FeedbackState)
- Define events (maps to current FeedbackAction types)
- Define states with proper hierarchy
- Define actions using `assign()`
- Define guards for conditional transitions

### Phase 3: Integrate with React (I013b)

Update `FeedbackProvider.tsx`:

- Replace `useReducer` with `useMachine`
- Use `useSelector` for optimized renders
- Keep existing context API for backward compatibility

### Phase 4: Add Invoked Services (I013c)

Wire up async operations:

- Screenshot capture (invoke `fromPromise`)
- Recording start/stop (invoke with callbacks)
- Integration submissions

## 💡 Key XState v5 Concepts

### 1. `setup()` API

```typescript
import { setup, assign } from "xstate";

const machine = setup({
  types: {
    context: {} as FeedbackContext,
    events: {} as FeedbackEvent,
  },
  actions: {
    setHoveredElement: assign({
      /* ... */
    }),
  },
  guards: {
    isActive: ({ context }) => context.internalIsActive,
  },
  actors: {
    captureScreenshot: fromPromise(async ({ input }) => {
      /* ... */
    }),
  },
}).createMachine({
  // machine config
});
```

### 2. Hierarchical States

```typescript
states: {
  inactive: {},
  active: {
    initial: 'idle',
    states: {
      idle: {},
      capturing: {},
      recording: {
        initial: 'initializing',
        states: {
          initializing: {},
          active: {},
          paused: {},
        },
      },
    },
  },
}
```

### 3. React Integration

```typescript
import { useMachine, useSelector } from "@xstate/react";

function FeedbackProvider() {
  const [snapshot, send, actorRef] = useMachine(feedbackMachine);

  // Optimized selector
  const isActive = useSelector(
    actorRef,
    (state) => state.context.internalIsActive,
  );
}
```

## 📝 Tasks Breakdown

Based on complexity, I013 should be split into:

| Task ID | Title                            | Description                                            | Effort    |
| ------- | -------------------------------- | ------------------------------------------------------ | --------- |
| I013a   | Create XState Machine Definition | Define states, events, context, actions, guards        | 2️⃣ Medium |
| I013b   | Integrate useMachine Hook        | Replace useReducer with useMachine in FeedbackProvider | 2️⃣ Medium |
| I013c   | Add Invoked Services             | Wire up async operations (screenshot, recording)       | 3️⃣ High   |
| I013d   | Update Tests                     | Update/add tests for state machine                     | 2️⃣ Medium |

## 🔗 External Resources

### Official Documentation

- [XState v5 Docs](https://stately.ai/docs)
- [XState React Package](https://stately.ai/docs/xstate-react)
- [XState Migration Guide](https://stately.ai/docs/migration)

### API Reference

- [XState API (jsdocs.io)](https://www.jsdocs.io/package/xstate)

### Examples

- [XState React Template](https://github.com/statelyai/xstate/tree/main/templates/react-ts)

## 📝 Research Date

**Conducted:** January 15, 2026

**Next Review:** When XState releases major updates or when significant refactoring is needed.

## ✅ Conclusion

**Recommendation: Implement XState v5 state machine** ⭐⭐⭐⭐⭐

XState v5 is the right choice for this widget because:

1. ✅ **Explicit State Modeling** - Current boolean flags create implicit states; XState makes them explicit
2. ✅ **Type Safety** - `setup()` API provides excellent TypeScript support
3. ✅ **Side Effect Management** - Actions, invoked services, and guards handle async operations cleanly
4. ✅ **Testability** - Pure transition functions enable unit testing without React
5. ✅ **Visualization** - State machines can be visualized in Stately Studio
6. ✅ **React Integration** - `@xstate/react` provides optimized hooks

---

- **Research compiled by:** GitHub Copilot
- **For project:** react-visual-feedback
- **Date:** January 15, 2026
