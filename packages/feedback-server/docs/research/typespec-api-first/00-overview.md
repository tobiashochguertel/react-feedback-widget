# TypeSpec API-First: Executive Summary

## Overview

This research investigates the technical debt identified in the feedback-server's API implementation, specifically the disconnect between the TypeSpec API specification and the actual server implementation.

## The Problem

During BDD test development, multiple API contract mismatches were discovered:

| Issue                | Specification | Implementation  | Impact                          |
| -------------------- | ------------- | --------------- | ------------------------------- |
| List response field  | Unknown       | `items`         | Tests failed expecting `data`   |
| Import request field | Unknown       | `items`         | Tests failed sending `data`     |
| Bulk delete method   | Unknown       | Body with `ids` | Tests failed using query params |
| Export format        | Unknown       | CSV only        | Tests expected JSON             |

**Root Cause:** The TypeSpec specification is only used to generate OpenAPI YAML for Swagger documentation. There is no runtime or compile-time enforcement of the API contract.

## Current Architecture

```
TypeSpec (.tsp files)
        ↓
    tsp compile
        ↓
OpenAPI YAML (openapi.yaml)
        ↓
Swagger UI (documentation only)

❌ No type generation
❌ No server code generation
❌ No client code generation
```

## Recommended Architecture

```
TypeSpec (.tsp files)
        ↓
    tsp compile
        ↓
┌───────────────────────────────────────────┐
│           OpenAPI YAML                     │
└───────────────────────────────────────────┘
        ↓                    ↓
openapi-typescript    @typespec/http-client-js
        ↓                    ↓
┌─────────────────┐  ┌─────────────────────┐
│ Server Types    │  │ Client SDK          │
│ (for Hono)      │  │ (for WebUI/CLI)     │
└─────────────────┘  └─────────────────────┘
        ↓                    ↓
  Hono Handlers       Frontend/CLI imports
  use types           generated client
```

## Key Benefits

### 1. Compile-Time Type Safety

```typescript
// ❌ Current: Manual types, can drift
const handler = async (c: Context) => {
  return c.json({ data: items }); // Wrong! Spec says "items"
};

// ✅ Recommended: Generated types, compile error
import type { FeedbackListResponse } from "@feedback/api-types";
const handler = async (c: Context) => {
  const response: FeedbackListResponse = { data: items }; // TS Error!
  return c.json(response);
};
```

### 2. Single Source of Truth

- TypeSpec is the authoritative API definition
- All code derived from it
- Changes propagate automatically

### 3. Breaking Change Detection

- Changing TypeSpec triggers regeneration
- Type errors highlight breaking changes
- Forces intentional API versioning

## Implementation Effort

| Phase              | Effort    | Description                             |
| ------------------ | --------- | --------------------------------------- |
| 1. Setup           | 🟢 Low    | Add openapi-typescript, configure build |
| 2. Generate Types  | 🟢 Low    | Run generation, create types package    |
| 3. Update Handlers | 🟡 Medium | Add type annotations to all handlers    |
| 4. Update Tests    | 🟡 Medium | Import types in test files              |
| 5. Client SDK      | 🟡 Medium | Generate and integrate client           |

**Estimated Total:** 1-2 days of focused work

## Risks

1. **Preview Status:** TypeSpec client/server emitters are in preview

   - Mitigation: openapi-typescript is stable (1.0+)

2. **Hono Not Natively Supported:** http-server-js doesn't support Hono

   - Mitigation: Use type-only approach with openapi-typescript

3. **Breaking Changes:** Existing code may not match spec
   - Mitigation: This is the point - fix mismatches now

## Recommendation

**Proceed with implementation** using the hybrid approach:

1. TypeSpec → OpenAPI (existing)
2. OpenAPI → TypeScript types (new: openapi-typescript)
3. TypeSpec → Client SDK (new: http-client-js)

This addresses the technical debt while maintaining compatibility with Hono.

---

**Next:** See [01-current-state.md](01-current-state.md) for detailed analysis of current implementation.
