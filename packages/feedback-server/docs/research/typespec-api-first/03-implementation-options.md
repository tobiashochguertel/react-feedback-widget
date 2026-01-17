# Implementation Options

## Overview

This document outlines the available implementation strategies for API-First development in the feedback-server, given the constraint of using Hono (not Express.js).

## Option 1: openapi-typescript (Recommended) ⭐⭐⭐⭐⭐

### Architecture

```
TypeSpec → OpenAPI → openapi-typescript → TypeScript Types
                                              ↓
                                         Hono Handlers
```

### Pros
- ✅ Stable, production-ready tooling
- ✅ Zero runtime overhead (types only)
- ✅ Works with any HTTP framework
- ✅ Companion `openapi-fetch` for clients
- ✅ Minimal changes to existing code

### Cons
- ❌ No generated router (manual wiring)
- ❌ Types must be manually applied
- ❌ No runtime validation (types only)

### Implementation Steps

1. **Install dependencies**
```bash
bun add -D openapi-typescript
bun add openapi-fetch  # For clients
```

2. **Add generation script**
```json
{
  "scripts": {
    "generate:openapi": "tsp compile typespec/",
    "generate:types": "openapi-typescript src/generated/openapi.yaml -o src/generated/api-types.d.ts",
    "generate": "bun run generate:openapi && bun run generate:types"
  }
}
```

3. **Apply types to handlers**
```typescript
import type { components, operations } from "./generated/api-types";

type FeedbackItem = components["schemas"]["FeedbackItem"];
type ListFeedbackResponse = operations["listFeedback"]["responses"]["200"]["content"]["application/json"];

app.get("/api/v1/feedback", async (c): Promise<Response> => {
  const response: ListFeedbackResponse = { items: [], pagination: {} };
  return c.json(response);
});
```

### Effort: 🟢 Low (1 day)

---

## Option 2: TypeSpec Client SDK + openapi-typescript

### Architecture

```
TypeSpec → OpenAPI → openapi-typescript → Server Types
    ↓
http-client-js → Client SDK Package
```

### Pros
- ✅ Type-safe server code
- ✅ Full-featured client SDK
- ✅ Client SDK can be shared across packages

### Cons
- ❌ http-client-js is in preview
- ❌ More complex build pipeline
- ❌ Two generation tools

### Implementation Steps

1. **Install dependencies**
```bash
bun add -D openapi-typescript @typespec/http-client-js
bun add openapi-fetch
```

2. **Update tspconfig.yaml**
```yaml
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

3. **Create client package structure**
```
packages/
├── feedback-server/          # Existing
├── feedback-api-client/      # Generated client SDK
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
└── feedback-server-cli/      # Can import client
```

### Effort: 🟡 Medium (2 days)

---

## Option 3: Shared Types Package (Manual)

### Architecture

```
packages/feedback-api-types/
├── src/
│   ├── models.ts           # Manually synced with TypeSpec
│   ├── requests.ts
│   ├── responses.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### Pros
- ✅ Full control over types
- ✅ No build tool dependencies
- ✅ Works immediately

### Cons
- ❌ Manual synchronization required
- ❌ Types can drift from spec
- ❌ Defeats purpose of API-First

### Implementation Steps

1. **Create package**
```bash
mkdir packages/feedback-api-types
cd packages/feedback-api-types
bun init
```

2. **Define types manually**
```typescript
// packages/feedback-api-types/src/models.ts
export interface FeedbackItem {
  id: string;
  type: "bug" | "feature" | "improvement";
  title: string;
  description: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  status?: "open" | "inProgress" | "resolved" | "closed";
}
```

3. **Import in other packages**
```typescript
import { FeedbackItem } from "@feedback/api-types";
```

### Effort: 🟢 Low (0.5 days)

**NOT RECOMMENDED:** Doesn't solve the root problem.

---

## Option 4: Switch to Express.js

### Architecture

```
TypeSpec → http-server-js → Express Router
                               ↓
                          Express App
```

### Pros
- ✅ Full TypeSpec integration
- ✅ Generated type-safe router
- ✅ Official Microsoft support

### Cons
- ❌ Major refactor required
- ❌ Lose Hono benefits (speed, edge runtime)
- ❌ Breaking change for deployment

### NOT RECOMMENDED for this project.

---

## Option 5: Hono + Zod Validation (Runtime)

### Architecture

```
TypeSpec → OpenAPI → openapi-typescript → Types
                 ↓
              zod-openapi → Zod Schemas
                               ↓
                          Hono Validators
```

### Pros
- ✅ Type safety at compile time
- ✅ Validation at runtime
- ✅ Automatic error responses

### Cons
- ❌ Additional tooling required
- ❌ More complex build
- ❌ Runtime overhead

### Implementation Example

```typescript
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const feedbackSchema = z.object({
  type: z.enum(["bug", "feature", "improvement"]),
  title: z.string().min(1),
  description: z.string().min(1),
  projectId: z.string().min(1),
});

app.post(
  "/api/v1/feedback",
  zValidator("json", feedbackSchema),
  async (c) => {
    const data = c.req.valid("json"); // Typed!
    // ...
  }
);
```

### Effort: 🟡 Medium (2 days)

---

## Comparison Matrix

| Option | Type Safety | Runtime Validation | Effort | Recommended |
|--------|-------------|-------------------|--------|-------------|
| 1. openapi-typescript | ✅ Compile | ❌ No | 🟢 Low | ⭐⭐⭐⭐⭐ |
| 2. + http-client-js | ✅ Compile | ❌ No | 🟡 Medium | ⭐⭐⭐⭐ |
| 3. Manual Types | ⚠️ Drift risk | ❌ No | 🟢 Low | ⭐ |
| 4. Switch to Express | ✅ Full | ✅ Optional | 🔴 High | ❌ |
| 5. Zod Validation | ✅ Compile | ✅ Yes | 🟡 Medium | ⭐⭐⭐ |

## Final Recommendation

**Option 1 (openapi-typescript)** for immediate implementation:

1. Lowest effort
2. Stable tooling
3. Solves the core problem (type drift)
4. Can add runtime validation later (Option 5)

**Future Enhancement:** Add Option 2 (http-client-js) when implementing feedback-server-cli to generate a proper client SDK.

---

## Implementation Plan

### Phase 1: Server Types (Day 1)

```bash
# Install
bun add -D openapi-typescript

# Add script to package.json
# Generate types
bun run generate:types

# Update 3-5 key handlers with types
# Run tests to verify
```

### Phase 2: Client SDK (Day 2)

```bash
# Install
bun add -D @typespec/http-client-js

# Update tspconfig.yaml
# Generate client package
# Test client in feedback-server-cli
```

### Phase 3: Full Migration (Day 3)

- Apply types to all handlers
- Update all tests to use types
- Add to CI/CD pipeline

---

**Next:** See [99-comparison-table.md](99-comparison-table.md) for detailed comparison.
