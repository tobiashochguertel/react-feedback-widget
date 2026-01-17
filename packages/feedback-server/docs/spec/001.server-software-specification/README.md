# Feedback Server - Software Specification

**Version**: 1.0.0
**Created**: 2026-01-16
**Updated**: 2026-01-16

## 🎯 Overview

The **Feedback Server** is a centralized backend service that:

- **Collects feedback** from multiple WebUI projects using the react-visual-feedback widget
- **Stores feedback data** persistently in a database (SQLite for simplicity, PostgreSQL for production)
- **Syncs data** back to connected clients for real-time updates
- **Provides REST API** for CRUD operations on feedback items
- **Runs as Docker container** for easy self-hosting deployment
- **Uses TypeSpec** for API specification and code generation

### Primary Goals

1. **Centralized Storage**: Store feedback from multiple client applications in one place
2. **Real-time Sync**: Push updates to connected clients when feedback changes
3. **Self-Hosted**: Run as a standalone Docker container without cloud dependencies
4. **Type Safety**: Use TypeSpec to generate consistent API types for all consumers
5. **Flexibility**: Support multiple storage backends and authentication methods

### Non-Goals

- This is NOT a SaaS product (no multi-tenancy, no billing)
- This is NOT a full-featured project management tool
- This does NOT include analytics dashboards (that's `server-webui`)
- This does NOT include CLI tools (that's `server-cli`)

---

## 📊 Feature Matrix

| Feature                 | Included | Technology         | Notes                               |
| ----------------------- | -------- | ------------------ | ----------------------------------- |
| REST API                | ✅       | Bun + Hono         | Fast, lightweight HTTP framework    |
| Feedback CRUD           | ✅       | REST endpoints     | Create, Read, Update, Delete        |
| Video blob storage      | ✅       | File system / S3   | Store video recordings              |
| Screenshot storage      | ✅       | File system / S3   | Store screenshot images             |
| WebSocket sync          | ✅       | Bun WebSocket      | Real-time client updates            |
| TypeSpec API definition | ✅       | TypeSpec → OpenAPI | Single source of truth for API      |
| SQLite support          | ✅       | Drizzle ORM        | Lightweight, file-based database    |
| PostgreSQL support      | ✅       | Drizzle ORM        | Production-ready database           |
| Docker deployment       | ✅       | Dockerfile         | Container-ready from start          |
| Authentication          | ⚠️       | JWT / API Keys     | Optional, configurable              |
| Rate limiting           | ⚠️       | Middleware         | Optional, configurable              |
| CORS configuration      | ✅       | Middleware         | Required for browser clients        |
| Health checks           | ✅       | Endpoint           | For container orchestration         |
| Metrics/observability   | ⚠️       | OpenTelemetry      | Optional, for production monitoring |

**Legend**: ✅ Included | ⚠️ Optional/Configurable | ❌ Not Included

---

## 🏗️ Architecture

### System Overview

```mermaid
graph TB
    subgraph "Client Applications"
        WebUI1[WebUI App 1]
        WebUI2[WebUI App 2]
        WebUI3[WebUI App 3]
    end

    subgraph "Feedback Server (Docker)"
        API[REST API<br/>Hono]
        WS[WebSocket<br/>Sync]
        Storage[Storage Service]
        DB[(Database<br/>SQLite/PostgreSQL)]
        Blob[Blob Storage<br/>File System/S3]
    end

    subgraph "Admin Tools"
        CLI[server-cli]
        AdminUI[server-webui]
    end

    WebUI1 -->|HTTP/WS| API
    WebUI2 -->|HTTP/WS| API
    WebUI3 -->|HTTP/WS| API

    API --> Storage
    WS --> Storage
    Storage --> DB
    Storage --> Blob

    CLI -->|HTTP| API
    AdminUI -->|HTTP/WS| API
```

### Technology Stack

| Layer          | Technology          | Rationale                                   |
| -------------- | ------------------- | ------------------------------------------- |
| Runtime        | Bun                 | Fast, modern, TypeScript-native             |
| HTTP Framework | Hono                | Lightweight, fast, multi-runtime            |
| API Definition | TypeSpec            | Generate OpenAPI + TypeScript types         |
| ORM            | Drizzle             | Type-safe, SQL-first, lightweight           |
| Database       | SQLite / PostgreSQL | SQLite for dev, Postgres for production     |
| Blob Storage   | File System / S3    | Local files for dev, S3-compatible for prod |
| Testing        | Vitest              | Fast, Bun-compatible, modern                |
| Container      | Docker              | Universal deployment                        |

### Directory Structure

```
packages/feedback-server/
├── docs/
│   └── spec/
│       ├── 001.server-software-specification/
│       │   └── README.md              # This file
│       ├── 002.server-tasks/
│       │   ├── TASKS-OVERVIEW.md
│       │   ├── TASKS-FEATURES.md
│       │   └── TASKS-IMPROVEMENTS.md
│       └── 003.server-user-stories/
│           └── README.md
├── typespec/
│   ├── main.tsp                       # Main TypeSpec definition
│   ├── models/
│   │   ├── feedback.tsp               # Feedback models
│   │   └── video.tsp                  # Video models
│   ├── routes/
│   │   ├── feedback.tsp               # Feedback endpoints
│   │   ├── video.tsp                  # Video endpoints
│   │   └── health.tsp                 # Health check endpoints
│   └── tspconfig.yaml                 # TypeSpec configuration
├── src/
│   ├── index.ts                       # Entry point
│   ├── app.ts                         # Hono app setup
│   ├── config.ts                      # Configuration
│   ├── routes/
│   │   ├── feedback.ts                # Feedback routes
│   │   ├── video.ts                   # Video routes
│   │   └── health.ts                  # Health routes
│   ├── services/
│   │   ├── FeedbackService.ts         # Feedback business logic
│   │   ├── VideoService.ts            # Video handling
│   │   └── SyncService.ts             # WebSocket sync
│   ├── storage/
│   │   ├── DrizzleAdapter.ts          # Database adapter
│   │   ├── BlobStorageAdapter.ts      # Blob storage adapter
│   │   └── schema.ts                  # Database schema
│   ├── middleware/
│   │   ├── auth.ts                    # Authentication
│   │   ├── cors.ts                    # CORS handling
│   │   └── rateLimit.ts               # Rate limiting
│   ├── generated/                     # TypeSpec output
│   │   ├── openapi.yaml               # OpenAPI spec
│   │   └── types.ts                   # TypeScript types
│   └── __tests__/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## 📐 API Design

### TypeSpec API Definition

The API is defined using TypeSpec, which generates:

1. **OpenAPI 3.1 spec** for documentation and client generation
2. **TypeScript types** for type-safe server implementation
3. **Shared types** for client packages

#### Core Models

```typespec
// typespec/models/feedback.tsp
import "@typespec/http";
using Http;

@doc("Feedback item submitted from a client application")
model Feedback {
  @visibility(Lifecycle.Read)
  @doc("Unique identifier")
  id: string;

  @doc("Type of feedback: bug, feature, or general")
  type: FeedbackType;

  @doc("User's feedback message")
  message: string;

  @doc("User email (optional)")
  email?: string;

  @doc("Screenshot URL if captured")
  screenshotUrl?: string;

  @doc("Video recording URL if captured")
  videoUrl?: string;

  @doc("Browser and system metadata")
  metadata: FeedbackMetadata;

  @doc("Workflow status")
  status: FeedbackStatus;

  @doc("Client application identifier")
  clientId: string;

  @visibility(Lifecycle.Read)
  @doc("Creation timestamp")
  createdAt: utcDateTime;

  @visibility(Lifecycle.Read)
  @doc("Last update timestamp")
  updatedAt: utcDateTime;
}

enum FeedbackType {
  bug,
  feature,
  general,
}

enum FeedbackStatus {
  open,
  inProgress,
  resolved,
  closed,
}

model FeedbackMetadata {
  userAgent: string;
  url: string;
  timestamp: utcDateTime;
  viewport?: Viewport;
  sessionId?: string;
}
```

### REST API Endpoints

| Method | Endpoint               | Description         | Auth Required |
| ------ | ---------------------- | ------------------- | ------------- |
| GET    | `/api/health`          | Health check        | No            |
| GET    | `/api/feedback`        | List all feedback   | Optional      |
| GET    | `/api/feedback/:id`    | Get single feedback | Optional      |
| POST   | `/api/feedback`        | Create new feedback | Optional      |
| PATCH  | `/api/feedback/:id`    | Update feedback     | Optional      |
| DELETE | `/api/feedback/:id`    | Delete feedback     | Optional      |
| POST   | `/api/feedback/bulk`   | Bulk import         | Optional      |
| GET    | `/api/feedback/export` | Bulk export         | Optional      |
| POST   | `/api/video`           | Upload video blob   | Optional      |
| GET    | `/api/video/:id`       | Get video blob      | No            |
| DELETE | `/api/video/:id`       | Delete video        | Optional      |

### WebSocket Events

| Event              | Direction     | Description                 |
| ------------------ | ------------- | --------------------------- |
| `feedback:created` | Server→Client | New feedback was created    |
| `feedback:updated` | Server→Client | Feedback was updated        |
| `feedback:deleted` | Server→Client | Feedback was deleted        |
| `client:register`  | Client→Server | Register client for updates |
| `ping`             | Both          | Keep-alive                  |

---

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_TYPE=sqlite           # sqlite | postgres
DATABASE_URL=./data/feedback.db
# For PostgreSQL:
# DATABASE_URL=postgres://user:pass@localhost:5432/feedback

# Blob Storage
BLOB_STORAGE_TYPE=filesystem   # filesystem | s3
BLOB_STORAGE_PATH=./data/blobs
# For S3:
# S3_ENDPOINT=https://s3.amazonaws.com
# S3_BUCKET=feedback-blobs
# S3_ACCESS_KEY=...
# S3_SECRET_KEY=...

# Authentication (optional)
AUTH_ENABLED=false
AUTH_TYPE=apikey               # apikey | jwt
API_KEY=your-secret-key
JWT_SECRET=your-jwt-secret

# CORS
CORS_ORIGINS=*                 # Comma-separated origins

# Rate Limiting (optional)
RATE_LIMIT_ENABLED=false
RATE_LIMIT_MAX=100             # Requests per window
RATE_LIMIT_WINDOW=60000        # Window in ms
```

### Docker Compose Example

```yaml
version: "3.8"

services:
  feedback-server:
    build: ./packages/feedback-server
    ports:
      - "3000:3000"
    environment:
      - DATABASE_TYPE=postgres
      - DATABASE_URL=postgres://feedback:feedback@db:5432/feedback
      - BLOB_STORAGE_TYPE=filesystem
      - BLOB_STORAGE_PATH=/data/blobs
    volumes:
      - feedback-data:/data
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=feedback
      - POSTGRES_PASSWORD=feedback
      - POSTGRES_DB=feedback
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  feedback-data:
  postgres-data:
```

---

## 🔌 Client Integration

### Using from react-visual-feedback

The react-visual-feedback widget can be configured to send feedback to this server:

```typescript
import { FeedbackProvider } from "react-visual-feedback";

function App() {
  return (
    <FeedbackProvider
      apiEndpoint="http://localhost:3000/api"
      clientId="my-app-identifier"
      onSubmit={async (feedback) => {
        // Automatic submission to server
      }}
    >
      <MyApp />
    </FeedbackProvider>
  );
}
```

### Real-time Updates

```typescript
import { useFeedbackSync } from "react-visual-feedback";

function FeedbackDashboard() {
  const { feedbackItems, isConnected } = useFeedbackSync({
    serverUrl: "ws://localhost:3000",
    clientId: "my-app",
  });

  return (
    <div>
      {feedbackItems.map((item) => (
        <FeedbackCard key={item.id} feedback={item} />
      ))}
    </div>
  );
}
```

---

## 🧪 Testing Strategy

### Unit Tests

- Service layer tests with mocked storage
- Middleware tests for auth, CORS, rate limiting
- Configuration validation tests

### Integration Tests

- Full API endpoint tests with test database
- WebSocket connection tests
- Blob storage tests

### E2E Tests

- Docker container tests
- Full client-server integration
- Multi-client sync tests

---

## 📦 Related Packages

| Package                          | Description                           | Status     |
| -------------------------------- | ------------------------------------- | ---------- |
| `packages/feedback-server`       | This package - REST API server        | 🔲 Planned |
| `packages/server-webui`          | Admin dashboard for managing feedback | 🔲 Planned |
| `packages/server-cli`            | CLI tool for server interaction       | 🔲 Planned |
| `packages/shared-types`          | Shared TypeScript types               | 🔲 Planned |
| `packages/react-visual-feedback` | Client widget                         | ✅ Active  |

---

## 📊 Success Metrics

| Metric         | Target  | Measurement         |
| -------------- | ------- | ------------------- |
| Response time  | < 100ms | p95 latency         |
| Startup time   | < 2s    | Container ready     |
| Memory usage   | < 256MB | Idle memory         |
| Test coverage  | > 80%   | Unit + Integration  |
| API compliance | 100%    | TypeSpec validation |

---

## 🔗 References

- [TypeSpec Documentation](https://typespec.io/)
- [Hono Framework](https://hono.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Bun Runtime](https://bun.sh/)

---

**Documentation compiled by:** GitHub Copilot
**For project:** react-visual-feedback / feedback-server
**Date:** January 16, 2026
