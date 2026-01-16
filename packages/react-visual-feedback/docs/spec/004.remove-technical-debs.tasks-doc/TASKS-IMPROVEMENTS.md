# Technical Debt Removal - Improvement Tasks

**Package:** react-visual-feedback v2.2.5
**Category:** Code Quality Improvements
**Last Updated:** January 18, 2026

---

## I001 - Remove Duplicate Type Exports (TS2484)

**Status:** ✅ DONE
**Priority:** 🟡 Medium
**Completed:** January 18, 2026

**Description:**
Multiple hook files contain duplicate `export type { X }` statements for the same types, causing TS2484 warnings. These re-exports are harmless but clutter the build output.

**Resolution:**
Removed duplicate `export type { }` blocks at the end of 7 hook files:

- `src/hooks/useActivation.ts`
- `src/hooks/useDashboard.ts`
- `src/hooks/useElementSelection.ts`
- `src/hooks/useFeedbackSubmission.ts`
- `src/hooks/useKeyboardShortcuts.ts`
- `src/hooks/useRecording.ts`
- `src/hooks/useScreenCapture.ts`

Also removed duplicate `StatusKey` export from `src/index.ts` (exported from both `./registry` and `./types`).

**Verification:**

- ✅ No TS2484 warnings during build
- ✅ All types still accessible from expected import paths
- ✅ No breaking changes to public API
- ✅ All 449 tests pass

---

## I002 - Remove Unused React Imports (TS6133)

**Status:** ✅ DONE
**Priority:** 🟡 Medium
**Completed:** January 18, 2026

**Description:**
Some component files import `React` explicitly, but with the new JSX runtime (React 17+), this is no longer necessary.

**Resolution:**
Removed unused `React` import from 3 Overlay components:

- `src/components/Overlay/ElementHighlight.tsx`
- `src/components/Overlay/ElementTooltip.tsx`
- `src/components/Overlay/SelectionOverlay.tsx`

Changed from `import React, { forwardRef, useMemo } from 'react'` to `import { forwardRef, useMemo } from 'react'`.

**Verification:**

- ✅ No TS6133 warnings for React imports
- ✅ All components render correctly
- ✅ All 449 tests pass
- ✅ Build completes successfully

---

## I003 - Fix exactOptionalPropertyTypes Warnings (TS2379)

**Status:** ⏭️ DEFERRED
**Priority:** 🟡 Medium

**Description:**
TypeScript's `exactOptionalPropertyTypes` strict mode flag causes warnings when optional properties are assigned without explicitly including `undefined` in the type union.

**Deferral Reason:**
The `exactOptionalPropertyTypes` warnings are caused by styled-components type definitions not being fully compatible with strict TypeScript mode. Fixing these would require:

1. Modifying styled-components' type exports (upstream issue)
2. Adding explicit type assertions throughout the codebase
3. Disabling `exactOptionalPropertyTypes` in tsconfig.json

These warnings do not affect runtime behavior and the build completes successfully. Deferred until styled-components improves TypeScript support.

**Affected Files:**

- `src/components/Overlay/ElementHighlight.tsx` - `$customBorderColor` prop
- `src/components/Overlay/ElementTooltip.tsx` - `id` property
- `src/components/Overlay/SelectionOverlay.tsx` - `componentInfo`, `$backgroundColor` props
- `src/hooks/useFeedbackSubmission.ts` - `error` property

**Original Description:**
When `exactOptionalPropertyTypes` is enabled, `prop?: string` means "prop may be missing" but if present, it must be a string. To allow `undefined` as a value, you need `prop?: string | undefined`.

**Implementation:**

1. Identify files with TS2379 warnings during build
2. For each optional property in interfaces/types, add `| undefined`:

   ```typescript
   // Before
   interface Props {
     optionalProp?: string;
   }

   // After
   interface Props {
     optionalProp?: string | undefined;
   }
   ```

3. Focus on:
   - `src/types/index.ts` - Core type definitions
   - Component props interfaces
   - Service interfaces
4. Run `npm run build` to verify warnings are resolved

**Acceptance Criteria:**

- [ ] No TS2379 warnings during build
- [ ] Types remain semantically correct
- [ ] All 449 tests pass
- [ ] No breaking changes to public API

**Testing:**

- Run `npm run build` with strict flags
- Run `npm test` to verify no regressions
- Verify type exports work correctly

**Dependencies:** styled-components TypeScript improvements (upstream)

---

## I004 - Consolidate Export Patterns in Hooks

**Status:** ✅ DONE
**Priority:** 🔴 Low
**Completed:** January 18, 2026

**Description:**
Hook files have inconsistent export patterns. Some use named exports, some use default exports, and some re-export types from multiple sources. Consolidate to a consistent pattern.

**Resolution:**
Removed redundant `export type { }` blocks from all 7 hook files as part of I001. All hooks now follow the pattern:

- Named function export at definition
- Types exported inline with definition
- No duplicate re-exports at end of file

**Verification:**

- ✅ All hooks follow same export pattern
- ✅ Types exported from single source
- ✅ No duplicate exports
- ✅ All 449 tests pass

**Dependencies:** I001 (completed)

---

## I005 - Add Missing JSDoc Documentation

**Status:** ✅ DONE
**Priority:** 🔴 Low
**Completed:** January 16, 2026

**Description:**
Some exported functions and types lacked JSDoc documentation. Adding documentation improves IDE experience and API discoverability.

**Resolution:**
Added comprehensive JSDoc documentation to `src/types/index.ts` with:

- Description for all exported types and interfaces
- `@param` documentation for properties
- `@example` usage examples for key types
- Category grouping with `@category` tags
- 352 lines of JSDoc added

**Implementation:**

1. Audit exported functions for missing JSDoc
2. Add JSDoc with:
   - Description of what the function does
   - `@param` for parameters
   - `@returns` for return values
   - `@example` for common usage
3. Focus on public API (hooks, types, components)

**Example:**

````typescript
/**
 * Hook to manage feedback form state and submission.
 *
 * @param options - Configuration options for the form
 * @returns Form state and handler functions
 *
 * @example
 * ```tsx
 * const { formState, handleSubmit } = useFeedbackForm({
 *   onSubmit: async (data) => { ... }
 * });
 * ```
 */
export function useFeedbackForm(options: FeedbackFormOptions): FeedbackFormResult {
````

**Verification:**

- ✅ All public types in `src/types/index.ts` have JSDoc
- ✅ JSDoc appears in IDE tooltips
- ✅ Examples included for key types
- ✅ Build completes successfully
- ✅ All 449 tests pass

**Commit:** `42b41e5 refactor(types): fix duplicate type definitions (I007)`

---

## I006 - Remove Unused Imports in Registry

**Status:** ✅ DONE
**Priority:** 🔴 Low
**Completed:** January 18, 2026

**Description:**
The `statusRegistry.ts` file imports icon components that are declared but not used in the current implementation, causing TS6133 warnings.

**Resolution:**
Removed unused `Ban` import from `src/registry/statusRegistry.ts`.

Changed from:

```typescript
import {
  Inbox,
  AlertCircle,
  Play,
  Eye,
  PauseCircle,
  CheckCircle,
  Archive,
  Ban,
  XCircle,
  Lightbulb,
  Bug,
  Zap,
  type LucideIcon,
} from "lucide-react";
```

To:

```typescript
import {
  Inbox,
  AlertCircle,
  Play,
  Eye,
  PauseCircle,
  CheckCircle,
  Archive,
  XCircle,
  Lightbulb,
  Bug,
  Zap,
  type LucideIcon,
} from "lucide-react";
```

**Verification:**

- ✅ No unused import warnings for registry file
- ✅ Registry functionality unchanged
- ✅ All 449 tests pass

---

## I007 - Clean Up Type Re-exports

**Status:** ✅ DONE
**Priority:** 🔴 Low
**Completed:** January 16, 2026

**Description:**
Types were re-exported from multiple locations with same names but different shapes, causing confusion about the authoritative source. Duplicate type definitions were renamed with context-specific prefixes.

**Resolution:**
Renamed duplicate types with context-specific prefixes and added backwards compatibility re-exports:

**Overlay components:**

- `HighlightStyle` → `OverlayHighlightStyle` (SelectionOverlay.tsx)
- `TooltipStyle` → `OverlayTooltipStyle` (SelectionOverlay.tsx)
- `ElementInfo` → `TooltipElementInfo` (ElementTooltip.tsx)

**Hooks:**

- `ElementInfo` → `SelectionElementInfo` (useElementSelection.ts)
- `HighlightStyle` → `SelectionHighlightStyle` (useElementSelection.ts)
- `TooltipStyle` → `SelectionTooltipStyle` (useElementSelection.ts)

**Services:**

- `RecordingResult` → `ServiceRecordingResult` (RecorderService.ts)

**Files Modified:**

- `src/components/Overlay/SelectionOverlay.tsx`
- `src/components/Overlay/ElementHighlight.tsx`
- `src/components/Overlay/ElementTooltip.tsx`
- `src/components/Overlay/index.ts`
- `src/hooks/useElementSelection.ts`
- `src/hooks/index.ts`
- `src/services/recording/RecorderService.ts`
- `src/services/recording/MediaRecorderService.ts`
- `src/services/recording/MockRecorderService.ts`
- `src/services/recording/index.ts`
- `src/services/index.ts`

**Verification:**

- ✅ Types have unique names with clear context
- ✅ Backwards compatibility maintained via re-exports
- ✅ Public API unchanged (`import { Type } from 'react-visual-feedback'`)
- ✅ No duplicate type name conflicts
- ✅ Build completes successfully
- ✅ All 449 unit tests pass
- ✅ All 120 BDD tests pass

**Commit:** `42b41e5 refactor(types): fix duplicate type definitions (I007)`

---

**Last Updated:** January 16, 2026
