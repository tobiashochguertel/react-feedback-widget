# ADR-001: Database Factory Pattern for Multi-Database Support

**Status:** PROPOSED
**Date:** 2025-01-20
**Decision Makers:** Development Team
**Technical Story:** Enable PostgreSQL support for production deployments

---

## 📋 Context

### Current State

The feedback-server is **hardcoded to SQLite** despite having infrastructure prepared for multi-database support:

**File: `src/db/index.ts`** (Active - SQLite Only)

```typescript
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { config } from "../config";

// Create SQLite database connection
const sqlite = new Database(getDatabasePath(config.databaseUrl), {
  create: true,
});

export const db = drizzle(sqlite, { schema });
```

**File: `src/db/factory.ts`** (Exists but UNUSED)

```typescript
/**
 * Database Factory
 *
 * Factory module that creates the appropriate database connection
 * based on the DATABASE_URL configuration.
 *
 * Supports:
 * - SQLite: file:./path/to/db or sqlite:./path/to/db
 * - PostgreSQL: postgres://user:pass@host:port/db or postgresql://...
 */

export function detectDatabaseType(url: string): DatabaseType {
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    return "postgres";
  }
  return "sqlite";
}

async function createPostgresConnection(
  url: string,
): Promise<PostgresConnection> {
  // ... PostgreSQL connection logic
}
```

### Problem

1. **Docker Compose defines PostgreSQL** but server ignores `DATABASE_URL`
2. **No runtime database selection** - always uses SQLite
3. **Factory pattern implemented but not wired up**
4. **Production deployments cannot use PostgreSQL**

### Discovery

This issue was discovered during deployment validation on 2025-01-20 when:

1. PostgreSQL container was healthy (`docker compose ps`)
2. Server logs showed SQLite path (`file:/app/data/feedback.db`)
3. Environment variable `DATABASE_URL=postgres://...` was ignored

---

## 🎯 Decision

**Recommended:** Implement the database factory pattern to enable runtime database selection.

### Option 1: Quick Fix (Minimal Changes) ✅ RECOMMENDED

Modify `src/db/index.ts` to use the factory:

```typescript
// src/db/index.ts
import { createDatabaseConnection, type DatabaseConnection } from "./factory";

let connection: DatabaseConnection | null = null;

export async function getDatabase(): Promise<DatabaseConnection> {
  if (!connection) {
    connection = await createDatabaseConnection();
  }
  return connection;
}

export async function checkDatabaseHealth() {
  const conn = await getDatabase();
  return conn.checkHealth();
}

// For backwards compatibility during migration
export const db = await (async () => {
  const conn = await createDatabaseConnection();
  return conn.db;
})();
```

**Pros:**

- Minimal code changes
- Uses existing factory implementation
- Backwards compatible

**Cons:**

- Async initialization adds complexity
- Need to update all `db` imports

### Option 2: Environment-Based Conditional Import

```typescript
// src/db/index.ts
import { config } from "../config";

const isPostgres = config.databaseUrl.startsWith("postgres");

export const db = isPostgres
  ? await import("./postgres").then((m) => m.db)
  : await import("./sqlite").then((m) => m.db);
```

**Pros:**

- Simple conditional
- Tree-shaking possible

**Cons:**

- Duplicates connection logic
- Harder to maintain

### Option 3: Keep SQLite Only (Current State)

Document SQLite as the only supported database and remove PostgreSQL from docker-compose.

**Pros:**

- No code changes
- Simpler deployment

**Cons:**

- Limits scalability
- Wastes existing PostgreSQL infrastructure

---

## ✅ Consequences

### If We Implement Option 1

**Positive:**

- PostgreSQL support for production
- Database URL-based configuration works
- Existing docker-compose.yml PostgreSQL service is usable
- Better scalability for larger deployments

**Negative:**

- Need to handle async database initialization
- All handlers using `db` directly need updates
- Migration scripts needed for PostgreSQL schema

### Required Changes

1. **Modify `src/db/index.ts`** - Use factory pattern
2. **Update handlers** - Handle async database access
3. **Add PostgreSQL schema** - `src/db/schema.pg.ts` (if not present)
4. **Add migration scripts** - For PostgreSQL schema creation
5. **Update tests** - Mock database factory
6. **Update docker-compose.yml** - Document PostgreSQL mode

---

## 📁 Files Affected

| File                  | Current State       | Change Required        |
| --------------------- | ------------------- | ---------------------- |
| `src/db/index.ts`     | SQLite hardcoded    | Use factory            |
| `src/db/factory.ts`   | Complete but unused | Wire up to index       |
| `src/db/schema.pg.ts` | May not exist       | Create if missing      |
| `src/config/index.ts` | Has DATABASE_URL    | No change              |
| `docker-compose.yml`  | PostgreSQL defined  | No change              |
| All handlers          | Use `db` directly   | May need async updates |

---

## 🗓️ Implementation Plan

### Phase 1: Quick Win (SQLite Mode Working)

- ✅ **DONE** - Deployment works with SQLite
- Document SQLite mode as default

### Phase 2: PostgreSQL Integration (Future)

- [ ] TS001: Wire up database factory in `index.ts`
- [ ] TS002: Update handlers for async database access
- [ ] TS003: Create PostgreSQL migrations
- [ ] TS004: Update docker-compose documentation
- [ ] TS005: Add integration tests for PostgreSQL

---

## 📊 Effort Estimate

| Task                  | Effort       | Risk       |
| --------------------- | ------------ | ---------- |
| Wire up factory       | 2 hours      | Low        |
| Update handlers       | 4 hours      | Medium     |
| PostgreSQL migrations | 2 hours      | Low        |
| Testing               | 4 hours      | Medium     |
| **Total**             | **12 hours** | **Medium** |

---

## 🔗 Related Documents

- [001.reference-deployment-specification](../../../docs/spec/001.reference-deployment-specification/README.md)
- [002.reference-deployment-tasks](../../../docs/spec/002.reference-deployment-tasks/TASKS-OVERVIEW.md)
- [Server Software Specification](./001.server-software-specification/README.md)

---

## 📝 Notes

### Why SQLite Works

The current SQLite-only implementation is functional because:

1. Server creates `data/feedback.db` automatically
2. SQLite is embedded (no network connection needed)
3. Drizzle ORM handles SQLite natively

### Why PostgreSQL Fails

PostgreSQL support is broken because:

1. `src/db/index.ts` ignores `DATABASE_URL` prefix detection
2. Factory pattern exists but is never called
3. No async initialization for PostgreSQL client

---

**ADR Created:** 2025-01-20
**Author:** GitHub Copilot
**Project:** react-feedback-widget
