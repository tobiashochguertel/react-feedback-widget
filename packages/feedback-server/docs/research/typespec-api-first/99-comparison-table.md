# Code Generation Options Comparison

## Overview

Detailed comparison of code generation approaches for implementing API-First development in the feedback-server.

## Tools Comparison

### TypeSpec Emitters

| Feature        | openapi3     | http-server-js | http-client-js |
| -------------- | ------------ | -------------- | -------------- |
| **Status**     | ✅ 1.0 GA    | 🟡 Preview     | 🟡 Preview     |
| **Output**     | OpenAPI YAML | TS Server Code | TS Client SDK  |
| **Express**    | N/A          | ✅ Yes         | N/A            |
| **Hono**       | N/A          | ❌ No          | N/A            |
| **Types**      | Schema       | Full           | Full           |
| **Router**     | N/A          | ✅ Generated   | N/A            |
| **Validation** | N/A          | ❌ No          | N/A            |
| **Effort**     | 🟢 Low       | 🟡 Medium      | 🟡 Medium      |

### OpenAPI-based Tools

| Feature        | openapi-typescript | openapi-fetch | zod-openapi |
| -------------- | ------------------ | ------------- | ----------- |
| **Status**     | ✅ Stable          | ✅ Stable     | ✅ Stable   |
| **Output**     | TS Types           | TS Client     | Zod Schemas |
| **Runtime**    | ❌ No              | ✅ Yes        | ✅ Yes      |
| **Validation** | ❌ No              | ❌ No         | ✅ Yes      |
| **Framework**  | Any                | Any           | Any         |
| **Effort**     | 🟢 Low             | 🟢 Low        | 🟡 Medium   |

## Feature Matrix

| Requirement            | Option 1 | Option 2 | Option 3 | Option 4 |
| ---------------------- | -------- | -------- | -------- | -------- |
| **Compile-time types** | ✅       | ✅       | ⚠️       | ✅       |
| **Runtime validation** | ❌       | ❌       | ❌       | ✅       |
| **Hono compatible**    | ✅       | ✅       | ✅       | ✅       |
| **Client SDK**         | ⚠️       | ✅       | ❌       | ⚠️       |
| **Low effort**         | ✅       | ⚠️       | ✅       | ⚠️       |
| **Future-proof**       | ✅       | ✅       | ❌       | ✅       |

**Legend:**

- Option 1: openapi-typescript only
- Option 2: openapi-typescript + http-client-js
- Option 3: Manual types package
- Option 4: openapi-typescript + Zod

## Build Pipeline Comparison

### Option 1: openapi-typescript (Simplest)

```mermaid
graph LR
    A[TypeSpec] --> B[OpenAPI]
    B --> C[openapi-typescript]
    C --> D[TypeScript Types]
    D --> E[Hono Handlers]
```

**Commands:**

```bash
tsp compile typespec/
openapi-typescript src/generated/openapi.yaml -o src/generated/api-types.d.ts
```

### Option 2: Full Generation

```mermaid
graph LR
    A[TypeSpec] --> B[OpenAPI]
    A --> C[http-client-js]
    B --> D[openapi-typescript]
    C --> E[Client SDK Package]
    D --> F[Server Types]
    E --> G[CLI/WebUI]
    F --> H[Hono Handlers]
```

**Commands:**

```bash
tsp compile typespec/  # Generates both OpenAPI and Client SDK
openapi-typescript src/generated/openapi.yaml -o src/generated/api-types.d.ts
```

## Cost-Benefit Analysis

| Factor             | Option 1 | Option 2  | Option 3  | Option 4  |
| ------------------ | -------- | --------- | --------- | --------- |
| **Setup Time**     | 1 hour   | 3 hours   | 30 min    | 4 hours   |
| **Migration Time** | 4 hours  | 6 hours   | 2 hours   | 8 hours   |
| **Maintenance**    | 🟢 Low   | 🟡 Medium | 🔴 High   | 🟡 Medium |
| **Type Safety**    | 🟢 High  | 🟢 High   | 🟡 Medium | 🟢 High   |
| **Runtime Safety** | ❌ None  | ❌ None   | ❌ None   | ✅ Full   |
| **Learning Curve** | 🟢 Low   | 🟡 Medium | 🟢 Low    | 🟡 Medium |

## Decision Matrix

### Weighted Scoring

| Criteria           | Weight | Opt 1    | Opt 2    | Opt 3    | Opt 4    |
| ------------------ | ------ | -------- | -------- | -------- | -------- |
| **Effort**         | 30%    | 10       | 7        | 9        | 5        |
| **Type Safety**    | 25%    | 9        | 10       | 5        | 10       |
| **Maintenance**    | 20%    | 9        | 8        | 4        | 7        |
| **Future-proof**   | 15%    | 8        | 10       | 3        | 9        |
| **Runtime Safety** | 10%    | 0        | 0        | 0        | 10       |
| **Total**          | 100%   | **8.15** | **7.75** | **5.05** | **7.55** |

### Recommendation

**Option 1 (openapi-typescript)** scores highest due to:

- Lowest implementation effort
- Good type safety
- Minimal maintenance overhead
- Easy to extend later

## Package Dependencies

### Option 1: Minimal

```json
{
  "devDependencies": {
    "@typespec/compiler": "^1.0.0",
    "@typespec/http": "^1.0.0",
    "@typespec/openapi3": "^1.0.0",
    "openapi-typescript": "^7.0.0"
  }
}
```

### Option 2: With Client SDK

```json
{
  "devDependencies": {
    "@typespec/compiler": "^1.0.0",
    "@typespec/http": "^1.0.0",
    "@typespec/openapi3": "^1.0.0",
    "@typespec/http-client-js": "^0.38.1",
    "openapi-typescript": "^7.0.0"
  }
}
```

### Option 4: With Zod

```json
{
  "devDependencies": {
    "@typespec/compiler": "^1.0.0",
    "@typespec/http": "^1.0.0",
    "@typespec/openapi3": "^1.0.0",
    "openapi-typescript": "^7.0.0",
    "zod": "^3.22.0",
    "@hono/zod-validator": "^0.2.0"
  }
}
```

## Conclusion

### For feedback-server (Hono + Bun)

**Implement Option 1 first**, then add Option 2 when building feedback-server-cli.

### Implementation Order

1. **Week 1:** Option 1 (openapi-typescript for server types)
2. **Week 2:** Option 2 addition (http-client-js for CLI)
3. **Future:** Option 4 (Zod validation for production hardening)

---

- **Research compiled by:** GitHub Copilot
- **For project:** react-visual-feedback / feedback-server
- **Date:** January 17, 2026
