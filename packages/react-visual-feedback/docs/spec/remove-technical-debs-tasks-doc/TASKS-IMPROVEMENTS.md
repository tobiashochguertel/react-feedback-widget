# Technical Debt Removal - Improvement Tasks

**Package:** react-visual-feedback v2.2.5
**Category:** Code Quality Improvements

---

## I001 - Remove Duplicate Type Exports (TS2484)

**Status:** 🔲 TODO
**Priority:** 🟡 Medium

**Description:**
Multiple hook files contain duplicate `export type { X }` statements for the same types, causing TS2484 warnings. These re-exports are harmless but clutter the build output.

**Current Behavior:**

```
TS2484: Export declaration conflicts with exported declaration of 'StatusKey'.
```

**Files Affected:**

- `src/hooks/useStatusUpdate.ts`
- `src/hooks/useFeedbackSubmission.ts`
- `src/hooks/useDashboard.ts`
- Other hook files with type re-exports

**Implementation:**

1. Identify all files with duplicate type exports using `grep -r "export type" src/hooks/`
2. Remove duplicate `export type` statements, keeping only one authoritative export
3. Ensure types are exported from their source files (e.g., `src/types/index.ts`)
4. Update imports in consumer files to reference the authoritative source
5. Run `npm run build` to verify warnings are gone

**Acceptance Criteria:**

- [ ] No TS2484 warnings during build
- [ ] All types still accessible from expected import paths
- [ ] No breaking changes to public API
- [ ] All 449 tests pass

**Testing:**

- Run `npm run build` and verify no TS2484 warnings
- Run `npm test` to verify no regressions

**Dependencies:** None

---

## I002 - Remove Unused React Imports (TS6133)

**Status:** 🔲 TODO
**Priority:** 🟡 Medium

**Description:**
Some component files import `React` explicitly, but with the new JSX runtime (React 17+), this is no longer necessary. The TS6133 warning indicates unused imports.

**Current Behavior:**

```
TS6133: 'React' is declared but its value is never read.
```

**Files Affected:**

- `src/registry/statusRegistry.ts` (and possibly others)
- Components using JSX without explicit React usage

**Implementation:**

1. Search for files with `import React from 'react'` pattern
2. Check if `React` is actually used (e.g., `React.useState`, `React.memo`)
3. If only JSX is used (not explicit React APIs), remove the import
4. If React APIs are used, convert to named imports: `import { useState, memo } from 'react'`
5. Verify JSX runtime is configured in tsconfig.json (`"jsx": "react-jsx"`)

**Acceptance Criteria:**

- [ ] No TS6133 warnings for React imports
- [ ] All components render correctly
- [ ] All 449 tests pass
- [ ] Build completes successfully

**Testing:**

- Run `npm run build` and verify no TS6133 warnings
- Run `npm test` to verify no regressions

**Dependencies:** None

---

## I003 - Fix exactOptionalPropertyTypes Warnings (TS2379)

**Status:** 🔲 TODO
**Priority:** 🟡 Medium

**Description:**
TypeScript's `exactOptionalPropertyTypes` strict mode flag causes warnings when optional properties are assigned without explicitly including `undefined` in the type union.

**Current Behavior:**

```
TS2379: Argument of type '{ prop?: string }' is not assignable to parameter of type '{ prop?: string | undefined }'.
```

**Root Cause:**
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

**Dependencies:** None

---

## I004 - Consolidate Export Patterns in Hooks

**Status:** 🔲 TODO
**Priority:** 🔴 Low

**Description:**
Hook files have inconsistent export patterns. Some use named exports, some use default exports, and some re-export types from multiple sources. Consolidate to a consistent pattern.

**Current State:**

```typescript
// Inconsistent patterns across files:
export function useHook() {}
export default useHook;
export type { SomeType } from "./types";
export { SomeType } from "../types";
```

**Implementation:**

1. Establish export pattern convention:
   - Named exports for hooks: `export function useXxx() {}`
   - Types exported from `src/types/index.ts` only
   - Re-exports in `src/hooks/index.ts` barrel file
2. Audit all hook files for consistency
3. Update to follow convention
4. Update barrel file `src/hooks/index.ts`

**Acceptance Criteria:**

- [ ] All hooks follow same export pattern
- [ ] Types exported from single source
- [ ] Barrel file provides clean public API
- [ ] No duplicate exports

**Dependencies:** I001 (type exports should be cleaned first)

---

## I005 - Add Missing JSDoc Documentation

**Status:** 🔲 TODO
**Priority:** 🔴 Low

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

**Status:** 🔲 TODO
**Priority:** 🔴 Low

**Description:**
The `statusRegistry.ts` file imports icon components that are declared but not used in the current implementation, causing TS6133 warnings.

**Current Behavior:**

```
TS6133: 'Ban' is declared but its value is never read.
```

**Files Affected:**

- `src/registry/statusRegistry.ts`

**Implementation:**

1. Open `src/registry/statusRegistry.ts`
2. Identify unused icon imports (Ban, etc.)
3. Either:
   - Remove unused imports if not needed
   - Use the imports if they should be part of the registry
   - Comment with `// @ts-ignore` if intentionally kept for future use
4. Run build to verify warnings resolved

**Acceptance Criteria:**

- [ ] No unused import warnings for registry file
- [ ] Registry functionality unchanged
- [ ] All 449 tests pass

**Dependencies:** None

---

## I007 - Clean Up Type Re-exports

**Status:** 🔲 TODO
**Priority:** 🔴 Low

**Description:**
Types are re-exported from multiple locations, causing confusion about the authoritative source. Establish a clean type export hierarchy.

**Current State:**
Types exported from:

- `src/types/index.ts` (primary)
- Individual hook files
- Component files
- Service files

**Implementation:**

1. Establish type export hierarchy:

   ```
   src/types/index.ts           # Primary source
   └── src/index.ts             # Public API re-export
   ```

2. Remove type exports from:
   - Individual hook files
   - Component files
   - Service files
3. Update imports to reference `src/types/index.ts`
4. Update public API in `src/index.ts`

**Acceptance Criteria:**

- [ ] Types exported from single authoritative source
- [ ] Public API unchanged (`import { Type } from 'react-visual-feedback'`)
- [ ] No duplicate export warnings
- [ ] All 449 tests pass

**Dependencies:** I001 (duplicate exports should be removed first)

---

**Last Updated:** January 16, 2026
