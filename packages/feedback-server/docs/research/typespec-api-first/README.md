# TypeSpec API-First Approach Research

Research on implementing proper API-First development using TypeSpec code generation for clients and servers.

## 📁 Research Documents

### Overview & Summary

- **[00-overview.md](00-overview.md)** - Executive summary and key findings

### Detailed Analysis

1. **[01-current-state.md](01-current-state.md)** - Analysis of current implementation gaps
2. **[02-typespec-capabilities.md](02-typespec-capabilities.md)** - TypeSpec 1.0 code generation features
3. **[03-implementation-options.md](03-implementation-options.md)** - Available approaches for API-First
4. **[04-modular-api-package-architecture.md](04-modular-api-package-architecture.md)** - Standalone API package with Taskfile automation
5. **[05-websocket-api-first.md](05-websocket-api-first.md)** - WebSocket API-First with TypeSpec Events + JSON Schema 🆕

### Comprehensive Comparison

- **[99-comparison-table.md](99-comparison-table.md)** - Comparison of code generation options

## 🎯 Quick Findings

### TL;DR: Implement TypeSpec Code Generation ✅

The current implementation only generates OpenAPI YAML for documentation, missing the key benefits of API-First development. TypeSpec 1.0 (GA) now provides **official emitters** for generating:

- **Server stubs** (`@typespec/http-server-js`)
- **Client SDKs** (`@typespec/http-client-js`)

### Key Metrics Comparison

| Aspect                    | Current State | Recommended State |
| ------------------------- | ------------- | ----------------- |
| OpenAPI Generation        | ✅ Yes        | ✅ Yes            |
| Server Type Safety        | ❌ Manual     | ✅ Generated      |
| Client Type Safety        | ❌ Manual     | ✅ Generated      |
| API-Spec Sync             | ❌ Manual     | ✅ Automatic      |
| Breaking Change Detection | ❌ None       | ✅ Compile-time   |

## 🔍 Research Methodology

### Criteria Evaluated

1. **TypeSpec 1.0 GA Status** ⭐⭐⭐⭐⭐

   - Core compiler is stable (1.0)
   - Code generation emitters are in "Preview"

2. **Code Generation Options** ⭐⭐⭐⭐⭐

   - Native TypeSpec emitters (http-server-js, http-client-js)
   - OpenAPI → TypeScript via openapi-typescript

3. **Framework Integration** ⭐⭐⭐⭐
   - Express.js supported natively
   - Hono requires adapter or alternative approach

### Data Sources

- [TypeSpec Official Documentation](https://typespec.io/) (Accessed: 2026-01-17)
- [TypeSpec 1.0 GA Announcement](https://typespec.io/blog/typespec-1-0-GA-release/) (Accessed: 2026-01-17)
- [TypeSpec GitHub Repository](https://github.com/microsoft/typespec) (Accessed: 2026-01-17)
- [openapi-typescript Documentation](https://openapi-ts.dev/) (Accessed: 2026-01-17)
- Context7 MCP server: TypeSpec library documentation

## 📊 Key Results

### TypeSpec 1.0 Components

| Component                | Status     | Purpose                |
| ------------------------ | ---------- | ---------------------- |
| @typespec/compiler       | ✅ 1.0 GA  | Core TypeSpec compiler |
| @typespec/http           | ✅ 1.0 GA  | HTTP protocol support  |
| @typespec/openapi3       | ✅ 1.0 GA  | OpenAPI 3.x output     |
| @typespec/http-server-js | 🟡 Preview | Server code generation |
| @typespec/http-client-js | 🟡 Preview | Client SDK generation  |

**Finding:** Server and client emitters are in preview but actively developed and recommended for API-First.

### Framework Support

| Framework    | http-server-js | Alternative        |
| ------------ | -------------- | ------------------ |
| Express.js   | ✅ Native      | -                  |
| Node.js HTTP | ✅ Native      | -                  |
| Hono         | ❌ Not native  | openapi-typescript |
| Fastify      | ❌ Not native  | openapi-typescript |

**Finding:** For Hono, use `openapi-typescript` to generate types from OpenAPI, then use types manually.

## 🎓 Recommendations by Use Case

### For feedback-server (Hono + Bun)

✅ **Recommended Approach: OpenAPI → TypeScript types**

Since TypeSpec's `http-server-js` emitter only supports Express.js/Node.js HTTP natively, and the project uses Hono:

1. Continue generating OpenAPI from TypeSpec
2. Add `openapi-typescript` to generate TypeScript types from OpenAPI
3. Use generated types in Hono route handlers
4. Generate client SDK with `@typespec/http-client-js` for consuming packages

**Reasons:**

- Hono not supported by http-server-js
- openapi-typescript is mature and well-supported
- Types ensure API contract compliance
- Client SDK can be shared across packages

### For Future Projects (Express.js/Node.js)

✅ **Use full TypeSpec code generation**

1. `@typespec/http-server-js` for server stubs
2. `@typespec/http-client-js` for client SDK
3. Implement generated interfaces in controllers

## 💡 Key Insights

### 1. TypeSpec 1.0 is Production-Ready

The core compiler and OpenAPI emitter are stable. Code generation emitters are in preview but actively maintained by Microsoft.

### 2. API-First Prevents the Technical Debt We Found

The issue of `items` vs `data` fields would have been caught at compile time with proper type generation.

### 3. Hybrid Approach Works for Hono

Using TypeSpec → OpenAPI → openapi-typescript gives type safety without requiring Express.js.

## 🔗 External Resources

### Official Documentation

- [TypeSpec Getting Started](https://typespec.io/docs/)
- [http-server-js Emitter](https://www.npmjs.com/package/@typespec/http-server-js)
- [http-client-js Emitter](https://www.npmjs.com/package/@typespec/http-client-js)
- [openapi-typescript](https://openapi-ts.dev/)

### Related Blog Posts

- [TypeSpec 1.0 GA Announcement](https://typespec.io/blog/typespec-1-0-GA-release/)
- [TypeSpec at London Stock Exchange](https://typespec.io/blog/typespec-at-lseg/)

## 📝 Research Date

**Conducted:** January 17, 2026

**Next Review:** Recommended when:

- TypeSpec http-server-js supports more frameworks
- Major version updates to TypeSpec
- Starting new API projects

## ✅ Conclusion

**Final Recommendation: Implement OpenAPI → TypeScript types for Hono** ⭐⭐⭐⭐⭐

The current implementation has a gap where the TypeSpec/OpenAPI spec is only used for documentation, not for enforcing API contracts. This leads to issues like the `items` vs `data` field mismatch.

### Why This Approach Wins

1. ✅ **Compile-time type safety** - Mismatches caught before runtime
2. ✅ **Single source of truth** - TypeSpec defines the API contract
3. ✅ **Compatible with Hono** - openapi-typescript works with any framework
4. ✅ **Client SDK generation** - Share types across packages
5. ✅ **Progressive adoption** - Can implement incrementally

### Implementation Strategy

1. Add `openapi-typescript` to generate types from OpenAPI
2. Create shared types package (`@feedback/api-types`)
3. Update Hono handlers to use generated types
4. Generate client SDK for frontend/CLI packages
5. Update tests to import types from shared package

---

- **Research compiled by:** GitHub Copilot
- **For project:** react-visual-feedback / feedback-server
- **Date:** January 17, 2026
