# API-First Technical Debt - Tasks Overview

**Source Specification**: [004.api-first-technical-debt/README.md](../004.api-first-technical-debt/README.md)
**Created**: 2026-01-17
**Updated**: 2026-01-18
**Architecture**: Modular API Package (Version 2.0)

---

## 📋 Quick Status Overview

| Category                  | Total  | Done | In Progress | TODO |
| ------------------------- | ------ | ---- | ----------- | ---- |
| Initial Setup (Legacy)    | 2      | 2    | 0           | 0    |
| Type Generation (Legacy)  | 2      | 2    | 0           | 0    |
| **Modular Architecture**  | **11** | 0    | 0           | 11   |
| Handler Migration         | 3      | 0    | 0           | 3    |
| Test Migration            | 2      | 0    | 0           | 2    |
| CI/CD Integration         | 3      | 0    | 0           | 3    |
| **Total**                 | **23** | 4    | 0           | 19   |

---

## 🏗️ Architecture Overview

The implementation follows a **modular API package architecture** (see [004.api-first-technical-debt](../004.api-first-technical-debt/README.md)):

```
packages/
├── feedback-server-api/     # 🆕 Standalone API specification
│   ├── Taskfile.yml         # Code generation tasks
│   └── typespec/            # TypeSpec definitions
├── generated/               # 🆕 Generated packages
│   ├── feedback-api-types/  # TypeScript types
│   ├── feedback-api-client-js/  # JS client SDK
│   └── feedback-api-schemas/    # JSON Schemas
└── feedback-server/         # Uses @feedback/api-types
```

---

## 🎯 Task Sets

### Set 0: Initial Setup (Completed - Legacy)

**Description**: Initial dependencies installed during first implementation phase.

| Task | Name                       | Status  | Priority | Dependencies | Completed  |
| ---- | -------------------------- | ------- | -------- | ------------ | ---------- |
| A001 | Install openapi-typescript | ✅ Done | 🟢 High  | -            | 2026-01-18 |
| A002 | Add Generation Scripts     | ✅ Done | 🟢 High  | A001         | 2026-01-18 |
| T001 | Generate Initial Types     | ✅ Done | 🟢 High  | A002         | 2026-01-18 |
| T002 | Create Type Aliases        | ✅ Done | 🟡 Medium| T001         | 2026-01-18 |

> **Note**: These tasks remain complete. The modular architecture builds upon this foundation.

---

### Set 1: Standalone API Package

**Description**: Create the standalone `feedback-server-api` package with TypeSpec and Taskfile.

| Task | Name                         | Status  | Priority | Dependencies | Completed |
| ---- | ---------------------------- | ------- | -------- | ------------ | --------- |
| M001 | Install Taskfile CLI         | 🔲 TODO | 🟢 High  | -            | -         |
| M002 | Create feedback-server-api   | 🔲 TODO | 🟢 High  | M001         | -         |
| M003 | Migrate TypeSpec from Server | 🔲 TODO | 🟢 High  | M002         | -         |
| M004 | Create API Taskfile.yml      | 🔲 TODO | 🟢 High  | M003         | -         |

---

### Set 2: Generated Packages Directory

**Description**: Set up the `packages/generated/` directory with skeleton packages.

| Task | Name                          | Status  | Priority | Dependencies | Completed |
| ---- | ----------------------------- | ------- | -------- | ------------ | --------- |
| G001 | Create generated/ directory   | 🔲 TODO | 🟢 High  | M004         | -         |
| G002 | Create feedback-api-types pkg | 🔲 TODO | 🟢 High  | G001         | -         |
| G003 | Create api-client-js pkg      | 🔲 TODO | 🟡 Medium| G001         | -         |
| G004 | Create api-schemas pkg        | 🔲 TODO | 🟡 Medium| G001         | -         |
| G005 | Configure .gitignore          | 🔲 TODO | 🟢 High  | G001         | -         |

---

### Set 3: Root Taskfile & Integration

**Description**: Create root Taskfile.yml and integrate with existing packages.

| Task | Name                           | Status  | Priority | Dependencies | Completed |
| ---- | ------------------------------ | ------- | -------- | ------------ | --------- |
| R001 | Create Root Taskfile.yml       | 🔲 TODO | 🟢 High  | G002         | -         |
| R002 | Update Workspace Config        | 🔲 TODO | 🟢 High  | G002         | -         |

---

### Set 4: Handler Migration

**Description**: Update feedback-server to use generated types from workspace package.

| Task | Name                         | Status  | Priority  | Dependencies | Completed |
| ---- | ---------------------------- | ------- | --------- | ------------ | --------- |
| H001 | Add @feedback/api-types dep  | 🔲 TODO | 🟢 High   | R002         | -         |
| H002 | Migrate Feedback Routes      | 🔲 TODO | 🟢 High   | H001         | -         |
| H003 | Migrate Video Routes         | 🔲 TODO | 🟡 Medium | H001         | -         |
| H004 | Migrate Health Routes        | 🔲 TODO | 🔴 Low    | H001         | -         |
| H005 | Remove Old Generated Dir     | 🔲 TODO | 🟡 Medium | H002         | -         |

---

### Set 5: Test Migration

**Description**: Update tests to use generated types from workspace package.

| Task | Name                     | Status  | Priority  | Dependencies | Completed |
| ---- | ------------------------ | ------- | --------- | ------------ | --------- |
| E001 | Update BDD Tests         | 🔲 TODO | 🟢 High   | H002         | -         |
| E002 | Update Integration Tests | 🔲 TODO | 🟡 Medium | H002         | -         |

---

### Set 6: CI/CD Integration

**Description**: Integrate Taskfile generation into CI/CD pipeline.

| Task | Name                        | Status  | Priority | Dependencies | Completed |
| ---- | --------------------------- | ------- | -------- | ------------ | --------- |
| I001 | Install Taskfile in CI      | 🔲 TODO | 🟢 High  | R001         | -         |
| I002 | Add task generate to CI     | 🔲 TODO | 🟢 High  | I001         | -         |
| I003 | Add Type Check to CI        | 🔲 TODO | 🟢 High  | I002         | -         |

---

## 📊 Task Summary (Dependency Order)

| Phase | Tasks                      | Description                        | Status  |
| ----- | -------------------------- | ---------------------------------- | ------- |
| 0     | A001, A002, T001, T002     | Initial setup (completed)          | ✅ Done |
| 1     | M001, M002, M003, M004     | Standalone API package             | 🔲 TODO |
| 2     | G001-G005                  | Generated packages directory       | 🔲 TODO |
| 3     | R001, R002                 | Root Taskfile & workspace          | 🔲 TODO |
| 4     | H001-H005                  | Handler migration                  | 🔲 TODO |
| 5     | E001, E002                 | Test migration                     | 🔲 TODO |
| 6     | I001, I002, I003           | CI/CD integration                  | 🔲 TODO |

---

## 📝 Task Details

### M001 - Install Taskfile CLI

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: None

**Description**: Install the `task` CLI for complex build automation.

**Implementation**:

```bash
# macOS with Homebrew
brew install go-task

# Alternative: Install via npm
npm install -g @go-task/cli

# Verify installation
task --version
```

**Acceptance Criteria**:

- [ ] `task` CLI installed and available in PATH
- [ ] `task --version` returns version info
- [ ] Team documentation updated with installation instructions

---

### M002 - Create feedback-server-api Package

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: M001

**Description**: Create the standalone API specification package.

**Implementation**:

```bash
mkdir -p packages/feedback-server-api
```

```json
// packages/feedback-server-api/package.json
{
  "name": "@feedback/server-api",
  "version": "1.0.0",
  "private": true,
  "description": "TypeSpec API specification for feedback-server",
  "scripts": {
    "generate": "task generate:all"
  },
  "devDependencies": {
    "@typespec/compiler": "^1.8.0",
    "@typespec/http": "^1.0.0",
    "@typespec/rest": "^1.0.0",
    "@typespec/openapi": "^1.0.0",
    "@typespec/openapi3": "^1.0.0",
    "@typespec/json-schema": "^1.0.0",
    "@typespec/http-client-js": "^0.38.0",
    "openapi-typescript": "^7.10.0"
  }
}
```

**Acceptance Criteria**:

- [ ] Package directory created
- [ ] package.json with all TypeSpec dependencies
- [ ] `bun install` succeeds in package directory

---

### M003 - Migrate TypeSpec from Server

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: M002

**Description**: Move TypeSpec files from feedback-server to feedback-server-api.

**Implementation**:

```bash
# Move TypeSpec directory
mv packages/feedback-server/typespec packages/feedback-server-api/

# Move tspconfig.yaml
mv packages/feedback-server/tspconfig.yaml packages/feedback-server-api/
```

**Acceptance Criteria**:

- [ ] `packages/feedback-server-api/typespec/` exists with all .tsp files
- [ ] `packages/feedback-server-api/tspconfig.yaml` exists
- [ ] `packages/feedback-server/typespec/` removed
- [ ] No broken references

---

### M004 - Create API Taskfile.yml

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: M003

**Description**: Create Taskfile.yml for the API package with all generation tasks.

**Implementation**:

```yaml
# packages/feedback-server-api/Taskfile.yml
version: '3'

vars:
  TYPESPEC_DIR: ./typespec
  OUTPUT_DIR: ../generated

tasks:
  default:
    desc: Generate all code from TypeSpec
    cmds:
      - task: generate:all

  generate:all:
    desc: Generate all outputs
    deps:
      - generate:openapi
    cmds:
      - task: generate:types
      - task: generate:client-js
      - task: generate:schemas

  generate:openapi:
    desc: Generate OpenAPI 3.1 specification
    sources:
      - "{{.TYPESPEC_DIR}}/**/*.tsp"
    cmds:
      - tsp compile {{.TYPESPEC_DIR}}

  generate:types:
    desc: Generate TypeScript types from OpenAPI
    deps: [generate:openapi]
    cmds:
      - openapi-typescript {{.OUTPUT_DIR}}/openapi/openapi.yaml -o {{.OUTPUT_DIR}}/feedback-api-types/src/api-types.d.ts

  generate:client-js:
    desc: Generate JavaScript client SDK
    cmds:
      - tsp compile {{.TYPESPEC_DIR}} --emit @typespec/http-client-js

  generate:schemas:
    desc: Generate JSON Schemas
    cmds:
      - tsp compile {{.TYPESPEC_DIR}} --emit @typespec/json-schema

  clean:
    desc: Clean generated files
    cmds:
      - rm -rf {{.OUTPUT_DIR}}/feedback-api-types/src/api-types.d.ts
      - rm -rf {{.OUTPUT_DIR}}/feedback-api-client-js/src
      - rm -rf {{.OUTPUT_DIR}}/feedback-api-schemas/schemas
```

**Acceptance Criteria**:

- [ ] `packages/feedback-server-api/Taskfile.yml` exists
- [ ] `task --list` shows all tasks
- [ ] `task generate:openapi` generates OpenAPI YAML

---

### G001 - Create Generated Directory

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: M004

**Description**: Create the `packages/generated/` directory structure.

**Implementation**:

```bash
mkdir -p packages/generated
```

**Acceptance Criteria**:

- [ ] `packages/generated/` directory exists
- [ ] Directory is tracked in git (with .gitkeep if empty)

---

### G002 - Create feedback-api-types Package

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: G001

**Description**: Create skeleton package for TypeScript types.

**Implementation**:

```json
// packages/generated/feedback-api-types/package.json
{
  "name": "@feedback/api-types",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

```typescript
// packages/generated/feedback-api-types/src/index.ts
// Re-export generated types
export * from "./api-types";

// Type aliases for convenience
export type { components, operations, paths } from "./api-types";
```

**Acceptance Criteria**:

- [ ] Package directory created with package.json
- [ ] index.ts exports ready for generated types
- [ ] Package importable via workspace:*

---

### G003 - Create api-client-js Package

**Status**: 🔲 TODO
**Priority**: 🟡 Medium
**Dependencies**: G001

**Description**: Create skeleton package for JavaScript client SDK.

**Implementation**:

```json
// packages/generated/feedback-api-client-js/package.json
{
  "name": "@feedback/api-client-js",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

**Acceptance Criteria**:

- [ ] Package directory created
- [ ] package.json configured
- [ ] Ready to receive generated code

---

### G004 - Create api-schemas Package

**Status**: 🔲 TODO
**Priority**: 🟡 Medium
**Dependencies**: G001

**Description**: Create skeleton package for JSON Schemas.

**Implementation**:

```json
// packages/generated/feedback-api-schemas/package.json
{
  "name": "@feedback/api-schemas",
  "version": "1.0.0",
  "private": true,
  "main": "./schemas/index.json"
}
```

**Acceptance Criteria**:

- [ ] Package directory created
- [ ] package.json configured
- [ ] Ready to receive generated schemas

---

### G005 - Configure .gitignore

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: G001

**Description**: Configure .gitignore to ignore generated source files.

**Implementation**:

```gitignore
# packages/generated/.gitignore

# Ignore generated source files
feedback-api-types/src/api-types.d.ts
feedback-api-client-js/src/
feedback-api-schemas/schemas/

# Keep skeleton files
!feedback-api-types/src/index.ts
!feedback-api-types/package.json
!feedback-api-client-js/package.json
!feedback-api-schemas/package.json
```

**Acceptance Criteria**:

- [ ] .gitignore created
- [ ] Generated source files are ignored
- [ ] Skeleton files are tracked
- [ ] `git status` shows correct ignored files

---

### R001 - Create Root Taskfile.yml

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: G002

**Description**: Create root Taskfile.yml for monorepo orchestration.

**Implementation**:

```yaml
# Taskfile.yml (root)
version: '3'

includes:
  api: ./packages/feedback-server-api

tasks:
  default:
    desc: Build entire project
    cmds:
      - task: build

  build:
    desc: Build all packages in dependency order
    cmds:
      - task: api:generate:all
      - bun run --filter "*" build

  dev:
    desc: Start development with generated types
    deps:
      - api:generate:all
    cmds:
      - bun run --filter feedback-server dev

  generate:
    desc: Generate all API artifacts
    cmds:
      - task: api:generate:all

  clean:
    desc: Clean all generated code
    cmds:
      - task: api:clean
```

**Acceptance Criteria**:

- [ ] Root Taskfile.yml exists
- [ ] `task --list` shows all tasks including included ones
- [ ] `task generate` runs API generation

---

### R002 - Update Workspace Config

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: G002

**Description**: Update root package.json to include generated packages in workspaces.

**Implementation**:

```json
// package.json (root)
{
  "workspaces": [
    "packages/*",
    "packages/generated/*"
  ]
}
```

**Acceptance Criteria**:

- [ ] package.json updated with new workspace pattern
- [ ] `bun install` resolves all workspace packages
- [ ] Workspace dependencies work correctly

---

### H001 - Add @feedback/api-types Dependency

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: R002

**Description**: Add workspace dependency to feedback-server.

**Implementation**:

```json
// packages/feedback-server/package.json
{
  "dependencies": {
    "@feedback/api-types": "workspace:*"
  }
}
```

```bash
bun install
```

**Acceptance Criteria**:

- [ ] Dependency added to package.json
- [ ] `bun install` succeeds
- [ ] Types importable from @feedback/api-types

---

### H002 - Migrate Feedback Routes

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: H001

**Description**: Update `src/routes/feedback.ts` to use generated types from workspace package.

**Implementation**:

```typescript
// packages/feedback-server/src/routes/feedback.ts
import type {
  FeedbackItem,
  CreateFeedbackRequest,
  PaginatedFeedbackList,
} from "@feedback/api-types";

app.get("/api/v1/feedback", async (c): Promise<Response> => {
  const items: FeedbackItem[] = await service.listAll();
  const response: PaginatedFeedbackList = {
    items,
    pagination: { /* ... */ },
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

- [ ] All feedback route handlers use @feedback/api-types
- [ ] Request bodies typed with generated types
- [ ] Response bodies typed with generated types
- [ ] `bun run typecheck` passes

---

### H003 - Migrate Video Routes

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

### H003 - Migrate Video Routes

**Status**: 🔲 TODO
**Priority**: 🟡 Medium
**Dependencies**: H001

**Description**: Update `src/routes/video.ts` to use generated types from @feedback/api-types.

**Implementation**: Same pattern as H002.

**Acceptance Criteria**:

- [ ] All video route handlers use @feedback/api-types
- [ ] Multipart upload types handled correctly
- [ ] `bun run typecheck` passes

---

### H004 - Migrate Health Routes

**Status**: 🔲 TODO
**Priority**: 🔴 Low
**Dependencies**: H001

**Description**: Update `src/routes/health.ts` to use generated types from @feedback/api-types.

**Implementation**: Minimal changes, health responses are simple.

**Acceptance Criteria**:

- [ ] Health endpoint responses typed
- [ ] `bun run typecheck` passes

---

### H005 - Remove Old Generated Directory

**Status**: 🔲 TODO
**Priority**: 🟡 Medium
**Dependencies**: H002

**Description**: Remove the old `src/generated/` directory now that types come from workspace package.

**Implementation**:

```bash
rm -rf packages/feedback-server/src/generated
```

**Acceptance Criteria**:

- [ ] Old generated directory removed
- [ ] No import errors
- [ ] All tests pass

---

### E001 - Update BDD Tests

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: H002

**Description**: Update BDD tests to import types from @feedback/api-types.

**Implementation**:

```typescript
import type {
  FeedbackItem,
  PaginatedFeedbackList,
} from "@feedback/api-types";

it("should return paginated feedback list", async () => {
  const response = await fetch("/api/v1/feedback");
  const data: PaginatedFeedbackList = await response.json();

  expect(data.items).toBeInstanceOf(Array);
  expect(data.pagination).toBeDefined();
});
```

**Acceptance Criteria**:

- [ ] All BDD test files import from @feedback/api-types
- [ ] Response assertions use proper types
- [ ] Tests continue to pass

---

### E002 - Update Integration Tests

**Status**: 🔲 TODO
**Priority**: 🟡 Medium
**Dependencies**: H002

**Description**: Update integration tests to use types from @feedback/api-types.

**Implementation**: Same pattern as E001.

**Acceptance Criteria**:

- [ ] Integration tests use @feedback/api-types
- [ ] All tests pass
- [ ] Type coverage improved

---

### I001 - Install Taskfile in CI

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: R001

**Description**: Add Taskfile installation step to CI pipeline.

**Implementation**:

```yaml
# .github/workflows/ci.yml
jobs:
  build:
    steps:
      - name: Install Taskfile
        run: |
          sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b ~/.local/bin
          echo "$HOME/.local/bin" >> $GITHUB_PATH
```

**Acceptance Criteria**:

- [ ] Taskfile CLI available in CI
- [ ] `task --version` works in CI

---

### I002 - Add task generate to CI

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: I001

**Description**: Add type generation step to CI pipeline using Taskfile.

**Implementation**:

```yaml
# .github/workflows/ci.yml
jobs:
  build:
    steps:
      - name: Generate Types
        run: task generate
```

**Acceptance Criteria**:

- [ ] CI runs `task generate`
- [ ] Generated files are created correctly
- [ ] CI fails if generation fails

---

### I003 - Add Type Check to CI

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: I002

**Description**: Add TypeScript type checking to CI pipeline.

**Implementation**:

```yaml
# .github/workflows/ci.yml
jobs:
  build:
    steps:
      - name: Type Check
        run: bun run --filter feedback-server typecheck
```

**Acceptance Criteria**:

- [ ] CI runs type checking
- [ ] CI fails if type errors detected
- [ ] Type errors block merge

---

## 📖 Implementation Notes

### Generation Order with Taskfile

```bash
# From monorepo root
task generate    # Runs api:generate:all

# This internally runs:
# 1. tsp compile typespec/     - Generate OpenAPI from TypeSpec
# 2. openapi-typescript        - Generate TypeScript from OpenAPI
# 3. http-client-js emitter    - Generate client SDK
# 4. json-schema emitter       - Generate JSON schemas
```

### Type Import Pattern (New)

```typescript
// Import from workspace package
import type { FeedbackItem, CreateFeedbackRequest } from "@feedback/api-types";

// For client SDK
import { FeedbackClient } from "@feedback/api-client-js";
```

### Handling Breaking Changes

If TypeSpec changes cause type errors:

1. Run `task generate` from root to regenerate all types
2. Run `bun run typecheck` to find all affected files
3. Fix type errors (these are legitimate API contract changes)
4. Update tests to match new contract

### Workspace Dependency Resolution

```bash
# Install all workspace dependencies
bun install

# Verify workspace packages
bun pm ls --all | grep @feedback
```

---

## 📐 Testing Notes

### Before Migration

```bash
# All 131 tests should pass
cd packages/feedback-server
bun test
```

### After Each Task

```bash
# Generate types (from root)
task generate

# Verify types
cd packages/feedback-server
bun run typecheck

# Verify tests
bun test
```

### After Full Migration

```bash
# Full verification (from root)
task generate
bun run --filter feedback-server typecheck
bun run --filter feedback-server test
bun run --filter feedback-server lint
```

---

**Last Updated**: 2026-01-18
**Author**: GitHub Copilot
