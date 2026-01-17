# @feedback/server-api

Standalone TypeSpec API specification package for the feedback-server.

## 📋 Overview

This package is the **single source of truth** for the feedback-server API contract. It contains TypeSpec definitions that generate:

- **OpenAPI 3.1 specification** - For documentation and tooling
- **TypeScript types** - For type-safe server implementation
- **JavaScript client SDK** - For consuming applications
- **JSON Schemas** - For runtime validation

## 🏗️ Architecture

```
feedback-server-api/
├── typespec/              # TypeSpec definitions
│   ├── main.tsp           # Entry point
│   ├── models/            # Data models
│   │   ├── feedback.tsp
│   │   └── video.tsp
│   └── routes/            # API routes
│       ├── feedback.tsp
│       ├── health.tsp
│       └── video.tsp
├── tspconfig.yaml         # TypeSpec emitter config
├── Taskfile.yml           # Code generation tasks
└── package.json
```

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.3.6
- [Taskfile](https://taskfile.dev/) (optional but recommended)

### Generate All Artifacts

```bash
# Using Taskfile (recommended)
task generate:all

# Using npm scripts
bun run generate
```

### Individual Generation

```bash
# Generate OpenAPI only
task generate:openapi

# Generate TypeScript types only
task generate:types

# Generate JavaScript client SDK
task generate:client-js

# Generate JSON Schemas
task generate:schemas
```

## 📦 Generated Outputs

Generated artifacts are placed in `packages/generated/`:

| Package                   | Content                     | Path                                   |
| ------------------------- | --------------------------- | -------------------------------------- |
| `@feedback/api-types`     | TypeScript type definitions | `../generated/feedback-api-types/`     |
| `@feedback/api-client-js` | JavaScript client SDK       | `../generated/feedback-api-client-js/` |
| `@feedback/api-schemas`   | JSON Schema definitions     | `../generated/feedback-api-schemas/`   |

## 🔧 Configuration

### tspconfig.yaml

```yaml
emit:
  - "@typespec/openapi3"
  - "@typespec/json-schema"
  - "@typespec/http-client-js"

options:
  "@typespec/openapi3":
    emitter-output-dir: "{project-root}/../generated/openapi"
    output-file: "openapi.yaml"
```

## 📖 Usage in Consumer Packages

```typescript
// Import types in feedback-server
import type { FeedbackItem, CreateFeedbackRequest } from "@feedback/api-types";

// Import client in CLI/WebUI
import { FeedbackClient } from "@feedback/api-client-js";
```

## 🔗 Related Documentation

- [API-First Technical Debt Spec](../feedback-server/docs/spec/004.api-first-technical-debt/)
- [API-First Tasks](../feedback-server/docs/spec/005.api-first-tasks/)
- [TypeSpec Documentation](https://typespec.io/)
- [Taskfile Documentation](https://taskfile.dev/)

---

**Last Updated**: 2026-01-18
