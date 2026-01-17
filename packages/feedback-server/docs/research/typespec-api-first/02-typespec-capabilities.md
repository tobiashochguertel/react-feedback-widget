# TypeSpec 1.0 Capabilities

## Overview

TypeSpec 1.0 was released as Generally Available (GA), providing a stable foundation for API-First development.

## Component Status (as of January 2026)

### Stable (1.0 GA)

| Package | Version | Purpose |
|---------|---------|---------|
| @typespec/compiler | 1.0.x | Core TypeSpec language compiler |
| @typespec/http | 1.0.x | HTTP protocol decorators and types |
| @typespec/openapi | 1.0.x | OpenAPI-specific decorators |
| @typespec/openapi3 | 1.0.x | OpenAPI 3.x schema generation |
| @typespec/json-schema | 1.0.x | JSON Schema output |
| typespec-vscode | 1.0.x | VS Code extension |

### Preview (Actively Developed)

| Package | Version | Purpose |
|---------|---------|---------|
| @typespec/http-server-js | 0.x | JavaScript/TypeScript server stubs |
| @typespec/http-client-js | 0.38.x | JavaScript/TypeScript client SDK |
| @typespec/http-server-csharp | 0.x | C# server stubs |
| @typespec/http-client-csharp | 0.x | C# client SDK |
| @typespec/http-client-java | 0.x | Java client SDK |
| @typespec/http-client-python | 0.x | Python client SDK |
| @typespec/protobuf | 0.x | Protocol Buffers output |

## Server Code Generation (http-server-js)

### Features

- Generates TypeScript server stubs
- Creates router with type-safe handlers
- Supports Express.js middleware integration
- Supports raw Node.js HTTP server

### Configuration

```yaml
emit:
  - "@typespec/openapi3"
  - "@typespec/http-server-js"

options:
  "@typespec/http-server-js":
    emitter-output-dir: "{output-dir}/server/generated"
    express: true
```

### Generated Output

```
tsp-output/@typespec/http-server-js/
├── http/
│   ├── router.ts           # Main router with type-safe dispatch
│   └── operations.ts       # Operation interfaces
├── models/
│   └── all.ts              # Generated TypeScript models
└── index.ts                # Main exports
```

### Usage Example (Express.js)

```typescript
import express from "express";
import { createFeedbackRouter } from "../tsp-output/@typespec/http-server-js/http/router.js";
import { FeedbackController } from "./controllers/feedback";

const router = createFeedbackRouter({
  feedback: new FeedbackController()
});

const app = express();
app.use(express.json());
app.use(router.expressMiddleware);
app.listen(3000);
```

### Limitations

- **Express.js only** for middleware integration
- Node.js HTTP server for raw usage
- **No Hono, Fastify, or Koa support**

## Client SDK Generation (http-client-js)

### Features

- Generates fully-typed TypeScript client
- Automatic request/response serialization
- Error handling with typed errors
- Configurable HTTP transport

### Configuration

```yaml
emit:
  - "@typespec/http-client-js"

options:
  "@typespec/http-client-js":
    emitter-output-dir: "{project-root}/clients/javascript"
    packageDetails:
      name: "@feedback/api-client"
      version: "1.0.0"
```

### Generated Output

```
clients/javascript/
├── src/
│   ├── client.ts           # Main client class
│   ├── models/
│   │   └── index.ts        # All model types
│   ├── operations/
│   │   └── index.ts        # API operations
│   └── index.ts            # Main exports
├── package.json            # NPM package config
└── tsconfig.json           # TypeScript config
```

### Usage Example

```typescript
import { FeedbackClient } from "@feedback/api-client";

const client = new FeedbackClient({
  baseUrl: "http://localhost:3000",
  // Optional: custom fetch, auth, etc.
});

// Fully typed!
const feedback = await client.feedback.list({
  projectId: "my-project",
  page: 1,
  limit: 20
});

console.log(feedback.items); // TypeScript knows this is FeedbackItem[]
```

## Alternative: openapi-typescript

For frameworks not supported by http-server-js (like Hono), use openapi-typescript.

### Features

- Generates TypeScript types from OpenAPI YAML/JSON
- Zero runtime overhead (types only)
- Works with any HTTP framework
- Companion `openapi-fetch` for type-safe HTTP calls

### Installation

```bash
npm install -D openapi-typescript
npm install openapi-fetch  # Optional: for type-safe fetch
```

### Configuration (package.json script)

```json
{
  "scripts": {
    "generate:types": "openapi-typescript src/generated/openapi.yaml -o src/generated/api-types.d.ts"
  }
}
```

### Generated Output

```typescript
// src/generated/api-types.d.ts
export interface paths {
  "/api/v1/feedback": {
    get: operations["listFeedback"];
    post: operations["createFeedback"];
  };
  "/api/v1/feedback/{id}": {
    get: operations["getFeedback"];
    patch: operations["updateFeedback"];
    delete: operations["deleteFeedback"];
  };
}

export interface components {
  schemas: {
    FeedbackItem: {
      id: string;
      type: "bug" | "feature" | "improvement";
      title: string;
      description: string;
      projectId: string;
      createdAt: string;
      updatedAt: string;
      status?: "open" | "inProgress" | "resolved" | "closed";
    };
    FeedbackListResponse: {
      items: components["schemas"]["FeedbackItem"][];
      pagination: components["schemas"]["PaginationInfo"];
    };
  };
}
```

### Usage with Hono

```typescript
import { Hono } from "hono";
import type { components } from "./generated/api-types";

type FeedbackItem = components["schemas"]["FeedbackItem"];
type FeedbackListResponse = components["schemas"]["FeedbackListResponse"];

const app = new Hono();

app.get("/api/v1/feedback", async (c) => {
  const items: FeedbackItem[] = await feedbackService.list();
  
  // TypeScript enforces correct structure
  const response: FeedbackListResponse = {
    items: items,  // ✅ Correct
    // data: items  // ❌ TypeScript Error!
    pagination: { page: 1, limit: 20, total: items.length }
  };
  
  return c.json(response);
});
```

### Usage with openapi-fetch (Client)

```typescript
import createClient from "openapi-fetch";
import type { paths } from "./generated/api-types";

const client = createClient<paths>({ 
  baseUrl: "http://localhost:3000" 
});

// Fully typed request and response
const { data, error } = await client.GET("/api/v1/feedback", {
  params: {
    query: { projectId: "my-project", page: 1 }
  }
});

if (data) {
  console.log(data.items); // TypeScript knows this is FeedbackItem[]
}
```

## Comparison

| Feature | http-server-js | openapi-typescript |
|---------|----------------|-------------------|
| Type Generation | ✅ Models + Operations | ✅ Types only |
| Server Stubs | ✅ Yes | ❌ No |
| Router | ✅ Express, Node | ❌ Manual |
| Hono Support | ❌ No | ✅ Yes (manual) |
| Runtime Code | ✅ Yes (router) | ❌ Types only |
| Maturity | 🟡 Preview | ✅ Stable |
| Client SDK | Separate (http-client-js) | ✅ openapi-fetch |

## Recommendation for feedback-server

Given that feedback-server uses **Hono** (not Express.js):

### Short-term (Recommended)

1. Use `openapi-typescript` for server types
2. Use `openapi-fetch` or `@typespec/http-client-js` for clients
3. Manually apply types to Hono handlers

### Long-term (When Available)

Watch for Hono support in http-server-js or community adapters.

---

**Next:** See [03-implementation-options.md](03-implementation-options.md) for implementation strategies.
