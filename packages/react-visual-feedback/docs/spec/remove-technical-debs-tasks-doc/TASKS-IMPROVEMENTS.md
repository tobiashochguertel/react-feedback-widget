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

**Status:** ⏭️ DEFERRED
**Priority:** 🔴 Low

**Deferral Reason:**
Low priority improvement. The codebase has extensive JSDoc on public APIs. Remaining gaps are non-critical and can be addressed incrementally.

**Description:**
Some exported functions and types lack JSDoc documentation. Adding documentation improves IDE experience and API discoverability.

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

**Acceptance Criteria:**

- [ ] All public hooks have JSDoc
- [ ] All public types have JSDoc
- [ ] JSDoc appears in IDE tooltips
- [ ] Examples are correct and runnable

**Dependencies:** None

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
  Inbox, AlertCircle, Play, Eye, PauseCircle,
  CheckCircle, Archive, Ban, XCircle, Lightbulb, Bug, Zap,
  type LucideIcon,
} from 'lucide-react';
```

To:
```typescript
import {
  Inbox, AlertCircle, Play, Eye, PauseCircle,
  CheckCircle, Archive, XCircle, Lightbulb, Bug, Zap,
  type LucideIcon,
} from 'lucide-react';
```

**Verification:**
- ✅ No unused import warnings for registry file
- ✅ Registry functionality unchanged
- ✅ All 449 tests pass

---

## I007 - Clean Up Type Re-exports

**Status:** ⏭️ DEFERRED
**Priority:** 🔴 Low
**Deferral Reason:** Low priority cosmetic improvement. After I001 removed duplicate exports, the current type structure is functional. A full type hierarchy refactor would be a larger undertaking better suited for a dedicated cleanup sprint.

**Description:**
Types are re-exported from multiple locations, causing confusion about the authoritative source. Establish a clean type export hierarchy.

**Current State:**
Types exported from:

- `src/types/index.ts` (primary)
- Individual hook files
- Component files
- Service files

**Acceptance Criteria:**

- [ ] Types exported from single authoritative source
- [ ] Public API unchanged (`import { Type } from 'react-visual-feedback'`)
- [ ] No duplicate export warnings
- [ ] All 449 tests pass

**Dependencies:** I001 (duplicate exports should be removed first)

---

**Last Updated:** January 18, 2026
