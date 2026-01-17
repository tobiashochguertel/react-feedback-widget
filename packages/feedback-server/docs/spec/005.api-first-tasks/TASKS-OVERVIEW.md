# API-First Technical Debt - Tasks Overview

**Source Specification**: [004.api-first-technical-debt/README.md](../004.api-first-technical-debt/README.md)
**Created**: 2026-01-17
**Updated**: 2026-01-17

---

## 📋 Quick Status Overview

| Category          | Total  | Done | In Progress | TODO |
| ----------------- | ------ | ---- | ----------- | ---- |
| Setup             | 2      | 0    | 0           | 2    |
| Type Generation   | 3      | 0    | 0           | 3    |
| Handler Migration | 3      | 0    | 0           | 3    |
| Test Migration    | 2      | 0    | 0           | 2    |
| Client SDK        | 2      | 0    | 0           | 2    |
| CI/CD Integration | 2      | 0    | 0           | 2    |
| **Total**         | **14** | 0    | 0           | 14   |

---

## 🎯 Task Sets

### Set 1: Project Setup

**Description**: Install dependencies and configure build tools for API-First development.

| Task | Name                       | Status  | Priority | Dependencies | Completed |
| ---- | -------------------------- | ------- | -------- | ------------ | --------- |
| A001 | Install openapi-typescript | 🔲 TODO | 🟢 High  | -            | -         |
| A002 | Add Generation Scripts     | 🔲 TODO | 🟢 High  | A001         | -         |

---

### Set 2: Type Generation

**Description**: Generate TypeScript types from OpenAPI specification.

| Task | Name                   | Status  | Priority  | Dependencies | Completed |
| ---- | ---------------------- | ------- | --------- | ------------ | --------- |
| T001 | Generate Initial Types | 🔲 TODO | 🟢 High   | A002         | -         |
| T002 | Create Type Aliases    | 🔲 TODO | 🟡 Medium | T001         | -         |
| T003 | Deprecate Manual Types | 🔲 TODO | 🟡 Medium | T002         | -         |

---

### Set 3: Handler Migration

**Description**: Apply generated types to Hono route handlers.

| Task | Name                    | Status  | Priority  | Dependencies | Completed |
| ---- | ----------------------- | ------- | --------- | ------------ | --------- |
| H001 | Migrate Feedback Routes | 🔲 TODO | 🟢 High   | T002         | -         |
| H002 | Migrate Video Routes    | 🔲 TODO | 🟡 Medium | T002         | -         |
| H003 | Migrate Health Routes   | 🔲 TODO | 🔴 Low    | T002         | -         |

---

### Set 4: Test Migration

**Description**: Update tests to use generated types for assertions.

| Task | Name                     | Status  | Priority  | Dependencies | Completed |
| ---- | ------------------------ | ------- | --------- | ------------ | --------- |
| E001 | Update BDD Tests         | 🔲 TODO | 🟢 High   | H001         | -         |
| E002 | Update Integration Tests | 🔲 TODO | 🟡 Medium | H001         | -         |

---

### Set 5: Client SDK Generation

**Description**: Generate client SDK package for consuming applications.

| Task | Name                     | Status  | Priority  | Dependencies | Completed |
| ---- | ------------------------ | ------- | --------- | ------------ | --------- |
| C001 | Configure http-client-js | 🔲 TODO | 🟡 Medium | A002         | -         |
| C002 | Create Client Package    | 🔲 TODO | 🟡 Medium | C001         | -         |

---

### Set 6: CI/CD Integration

**Description**: Integrate type generation into CI/CD pipeline.

| Task | Name                      | Status  | Priority | Dependencies | Completed |
| ---- | ------------------------- | ------- | -------- | ------------ | --------- |
| I001 | Add Type Generation to CI | 🔲 TODO | 🟢 High  | T001         | -         |
| I002 | Add Type Check to CI      | 🔲 TODO | 🟢 High  | I001         | -         |

---

## 📊 Task Summary (Dependency Order)

| Phase | Tasks            | Description                    | Status  |
| ----- | ---------------- | ------------------------------ | ------- |
| 1     | A001, A002       | Project setup and dependencies | 🔲 TODO |
| 2     | T001, T002, T003 | Type generation and aliases    | 🔲 TODO |
| 3     | H001, H002, H003 | Handler migration              | 🔲 TODO |
| 4     | E001, E002       | Test migration                 | 🔲 TODO |
| 5     | C001, C002       | Client SDK generation          | 🔲 TODO |
| 6     | I001, I002       | CI/CD integration              | 🔲 TODO |

---

## 📝 Task Details

### A001 - Install openapi-typescript

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: None

**Description**: Install the `openapi-typescript` package to generate TypeScript types from the OpenAPI specification.

**Implementation**:

```bash
bun add -D openapi-typescript
bun add openapi-fetch  # For client-side fetching if needed
```

**Acceptance Criteria**:

- [ ] `openapi-typescript` installed as devDependency
- [ ] `openapi-fetch` installed as dependency
- [ ] No version conflicts with existing packages

---

### A002 - Add Generation Scripts

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: A001

**Description**: Add npm scripts to `package.json` for generating TypeScript types from OpenAPI.

**Implementation**:

```json
{
  "scripts": {
    "generate": "bun run generate:openapi && bun run generate:types",
    "generate:openapi": "tsp compile typespec/",
    "generate:types": "openapi-typescript src/generated/openapi.yaml -o src/generated/api-types.d.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

**Acceptance Criteria**:

- [ ] `bun run generate` runs both steps
- [ ] `bun run generate:openapi` compiles TypeSpec
- [ ] `bun run generate:types` generates TypeScript types
- [ ] `bun run typecheck` validates all types

---

### T001 - Generate Initial Types

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: A002

**Description**: Run the type generation and verify output at `src/generated/api-types.d.ts`.

**Implementation**:

```bash
bun run generate
```

**Acceptance Criteria**:

- [ ] `src/generated/api-types.d.ts` file exists
- [ ] File contains `components` type with all schemas
- [ ] File contains `operations` type with all endpoints
- [ ] No TypeScript errors in generated file

---

### T002 - Create Type Aliases

**Status**: 🔲 TODO
**Priority**: 🟡 Medium
**Dependencies**: T001

**Description**: Create a convenience module that re-exports commonly used types with simpler names.

**Implementation**:

```typescript
// src/generated/types.ts
export type { components, operations, paths } from "./api-types";

// Convenience aliases
import type { components } from "./api-types";

export type FeedbackItem = components["schemas"]["FeedbackItem"];
export type CreateFeedbackRequest =
  components["schemas"]["CreateFeedbackRequest"];
export type UpdateFeedbackRequest =
  components["schemas"]["UpdateFeedbackRequest"];
export type PaginatedFeedbackList =
  components["schemas"]["PaginatedFeedbackList"];
export type VideoMetadata = components["schemas"]["VideoMetadata"];
export type HealthResponse = components["schemas"]["HealthResponse"];
export type ErrorResponse = components["schemas"]["ErrorResponse"];
```

**Acceptance Criteria**:

- [ ] `src/generated/types.ts` file created
- [ ] All major API types have convenient aliases
- [ ] Types are exported and importable

---

### T003 - Deprecate Manual Types

**Status**: 🔲 TODO
**Priority**: 🟡 Medium
**Dependencies**: T002

**Description**: Mark manual type definitions in `src/types/index.ts` as deprecated and remove API-contract types.

**Implementation**:

```typescript
// src/types/index.ts

// DEPRECATED: Use generated types from "@/generated/types"
// These types are for internal use only (not part of API contract)

/** @deprecated Use FeedbackItem from @/generated/types */
export interface LegacyFeedbackItem {
  // ...keep only for backward compatibility during migration
}

// Internal types that are NOT part of API contract
export interface ServiceConfig {
  // ...
}
```

**Acceptance Criteria**:

- [ ] API contract types removed from `src/types/index.ts`
- [ ] Deprecation comments added
- [ ] Internal-only types remain
- [ ] No breaking changes for existing code

---

### H001 - Migrate Feedback Routes

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: T002

**Description**: Update `src/routes/feedback.ts` to use generated types for request/response typing.

**Implementation**:

```typescript
import type {
  FeedbackItem,
  CreateFeedbackRequest,
  PaginatedFeedbackList,
} from "../generated/types";

app.get("/api/v1/feedback", async (c): Promise<Response> => {
  const items: FeedbackItem[] = await service.listAll();
  const response: PaginatedFeedbackList = {
    items,
    pagination: {
      /* ... */
    },
  };
  return c.json(response);
});

app.post("/api/v1/feedback", async (c): Promise<Response> => {
  const body: CreateFeedbackRequest = await c.req.json();
  const item: FeedbackItem = await service.create(body);
  return c.json(item, 201);
});
```

**Acceptance Criteria**:

- [ ] All feedback route handlers use generated types
- [ ] Request bodies typed with generated types
- [ ] Response bodies typed with generated types
- [ ] `bun run typecheck` passes

---

### H002 - Migrate Video Routes

**Status**: 🔲 TODO
**Priority**: 🟡 Medium
**Dependencies**: T002

**Description**: Update `src/routes/video.ts` to use generated types.

**Implementation**: Same pattern as H001.

**Acceptance Criteria**:

- [ ] All video route handlers use generated types
- [ ] Multipart upload types handled correctly
- [ ] `bun run typecheck` passes

---

### H003 - Migrate Health Routes

**Status**: 🔲 TODO
**Priority**: 🔴 Low
**Dependencies**: T002

**Description**: Update `src/routes/health.ts` to use generated types.

**Implementation**: Minimal changes, health responses are simple.

**Acceptance Criteria**:

- [ ] Health endpoint responses typed
- [ ] `bun run typecheck` passes

---

### E001 - Update BDD Tests

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: H001

**Description**: Update BDD tests to import and use generated types for response validation.

**Implementation**:

```typescript
import type {
  FeedbackItem,
  PaginatedFeedbackList,
} from "../../src/generated/types";

it("should return paginated feedback list", async () => {
  const response = await fetch("/api/v1/feedback");
  const data: PaginatedFeedbackList = await response.json();

  expect(data.items).toBeInstanceOf(Array);
  expect(data.pagination).toBeDefined();
});
```

**Acceptance Criteria**:

- [ ] All BDD test files import generated types
- [ ] Response assertions use proper types
- [ ] Tests continue to pass

---

### E002 - Update Integration Tests

**Status**: 🔲 TODO
**Priority**: 🟡 Medium
**Dependencies**: H001

**Description**: Update integration tests to use generated types.

**Implementation**: Same pattern as E001.

**Acceptance Criteria**:

- [ ] Integration tests use generated types
- [ ] All tests pass
- [ ] Type coverage improved

---

### C001 - Configure http-client-js

**Status**: 🔲 TODO
**Priority**: 🟡 Medium
**Dependencies**: A002

**Description**: Add `@typespec/http-client-js` to tspconfig.yaml for client SDK generation.

**Implementation**:

```yaml
# typespec/tspconfig.yaml
emit:
  - "@typespec/openapi3"
  - "@typespec/http-client-js"

options:
  "@typespec/openapi3":
    emitter-output-dir: "{project-root}/src/generated"
    output-file: "openapi.yaml"
  "@typespec/http-client-js":
    emitter-output-dir: "{project-root}/../feedback-api-client"
    packageDetails:
      name: "@feedback/api-client"
      version: "1.0.0"
```

**Acceptance Criteria**:

- [ ] `@typespec/http-client-js` installed
- [ ] tspconfig.yaml updated
- [ ] `bun run generate:openapi` generates client code

---

### C002 - Create Client Package

**Status**: 🔲 TODO
**Priority**: 🟡 Medium
**Dependencies**: C001

**Description**: Set up the `packages/feedback-api-client` package structure.

**Implementation**:

```
packages/feedback-api-client/
├── src/                    # Generated by http-client-js
├── package.json
├── tsconfig.json
└── README.md
```

**Acceptance Criteria**:

- [ ] Package directory created
- [ ] package.json with name `@feedback/api-client`
- [ ] tsconfig.json configured
- [ ] Can be imported by other packages

---

### I001 - Add Type Generation to CI

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: T001

**Description**: Add type generation step to CI pipeline (GitHub Actions).

**Implementation**:

```yaml
# .github/workflows/ci.yml
jobs:
  build:
    steps:
      - name: Generate Types
        run: bun run generate
        working-directory: packages/feedback-server
```

**Acceptance Criteria**:

- [ ] CI runs `bun run generate`
- [ ] Generated files are checked for correctness
- [ ] CI fails if generation fails

---

### I002 - Add Type Check to CI

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: I001

**Description**: Add TypeScript type checking to CI pipeline.

**Implementation**:

```yaml
# .github/workflows/ci.yml
jobs:
  build:
    steps:
      - name: Type Check
        run: bun run typecheck
        working-directory: packages/feedback-server
```

**Acceptance Criteria**:

- [ ] CI runs `bun run typecheck`
- [ ] CI fails if type errors detected
- [ ] Type errors block merge

---

## 📖 Implementation Notes

### Generation Order

Always run generation in this order:

1. `tsp compile typespec/` - Generate OpenAPI from TypeSpec
2. `openapi-typescript` - Generate TypeScript from OpenAPI

This is automated by `bun run generate`.

### Type Import Pattern

```typescript
// Preferred: Import from convenience module
import type { FeedbackItem, CreateFeedbackRequest } from "../generated/types";

// Alternative: Import directly from generated file
import type { components } from "../generated/api-types";
type FeedbackItem = components["schemas"]["FeedbackItem"];
```

### Handling Breaking Changes

If TypeSpec changes cause type errors:

1. Run `bun run generate` to regenerate types
2. Run `bun run typecheck` to find all affected files
3. Fix type errors (these are legitimate API contract changes)
4. Update tests to match new contract

---

## 📐 Testing Notes

### Before Migration

```bash
# All 131 tests should pass
bun test
```

### After Each Task

```bash
# Verify types
bun run generate
bun run typecheck

# Verify tests
bun test
```

### After Full Migration

```bash
# Full verification
bun run generate
bun run typecheck
bun test
bun run lint
```

---

**Last Updated**: 2026-01-17
**Author**: GitHub Copilot
