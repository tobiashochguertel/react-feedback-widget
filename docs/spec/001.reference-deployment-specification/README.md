# Reference Deployment - Software Specification

**Version**: 1.0.0
**Created**: 2026-01-19
**Updated**: 2026-01-19

## 🎯 Overview

The **Reference Deployment** is a Docker Compose-based orchestration that deploys the complete React Visual Feedback solution as a self-contained, production-ready system. It provides:

- **Single-command deployment** of all services using `docker compose up -d` or `task up`
- **Multi-stage Dockerfiles** for optimized, fast-building container images
- **Entrypoint scripts** with permission checks, health monitoring, and graceful shutdown
- **Centralized configuration** via `.env` files
- **Unified Taskfile automation** for build, deploy, publish, and maintenance operations
- **Reference architecture** for production deployments

### Primary Goals

1. **Turnkey Deployment**: Deploy the entire solution with a single command
2. **Fast Builds**: Use Docker layer caching and multi-stage builds for efficient CI/CD
3. **Production-Ready**: Include health checks, graceful shutdown, and security best practices
4. **Self-Hosting**: No cloud dependencies - runs on any Docker-capable infrastructure
5. **Developer Experience**: Consistent Taskfile-based workflows across all packages
6. **Observable**: Logs, health endpoints, and status checks for all services

### Non-Goals

- NOT a Kubernetes-native deployment (though images can be used in K8s)
- NOT a managed cloud service (no AWS/GCP/Azure integration)
- NOT a multi-tenancy solution (single instance per deployment)
- NOT automated scaling (manual scaling via docker compose replicas)

---

## 📊 Feature Matrix

| Feature                     | Included | Technology         | Notes                                      |
| --------------------------- | -------- | ------------------ | ------------------------------------------ |
| Multi-service orchestration | ✅       | Docker Compose     | Single docker-compose.yml for all services |
| Multi-stage builds          | ✅       | Docker             | Build + production stages                  |
| Entrypoint scripts          | ✅       | Shell/Bun          | Permission checks, health waits            |
| Health checks               | ✅       | Docker + curl/wget | All services report health                 |
| Centralized configuration   | ✅       | .env files         | Single source for env vars                 |
| Taskfile automation         | ✅       | Taskfile.yml       | Build, deploy, logs, restart, reset        |
| Volume persistence          | ✅       | Docker volumes     | Data survives container restarts           |
| Network isolation           | ✅       | Docker networks    | Service-to-service communication           |
| PostgreSQL database         | ✅       | PostgreSQL 16      | Production-ready database                  |
| Blob storage                | ✅       | Volume mount       | Screenshots, videos                        |
| Reverse proxy               | ⚠️       | Nginx/Traefik      | Optional: for production domains           |
| SSL/TLS termination         | ⚠️       | Let's Encrypt      | Optional: production HTTPS                 |
| Logging aggregation         | ⚠️       | Docker logs        | Optional: ELK/Loki stack                   |
| Monitoring                  | ⚠️       | Prometheus         | Optional: metrics collection               |

**Legend**: ✅ Included | ⚠️ Optional/Configurable | ❌ Not Included

---

## 📦 Services Overview

### Service Inventory

| Service                 | Package                          | Port | Purpose                                |
| ----------------------- | -------------------------------- | ---- | -------------------------------------- |
| `feedback-server`       | `packages/feedback-server`       | 3000 | REST API + WebSocket sync              |
| `feedback-webui`        | `packages/feedback-server-webui` | 3001 | Admin dashboard (React SPA)            |
| `feedback-example`      | `packages/feedback-example`      | 3002 | Next.js example app with widget        |
| `react-visual-feedback` | `packages/react-visual-feedback` | N/A  | Widget library (build-only, no server) |
| `postgres`              | PostgreSQL 16                    | 5432 | Database service                       |

### Service Dependencies

```mermaid
graph TD
    subgraph "External Access"
        Browser[Browser]
    end

    subgraph "Docker Compose Stack"
        Example[feedback-example<br/>:3002]
        WebUI[feedback-webui<br/>:3001]
        Server[feedback-server<br/>:3000]
        DB[(PostgreSQL<br/>:5432)]
        Widget[react-visual-feedback<br/>npm package]
    end

    Browser --> Example
    Browser --> WebUI
    Example --> Server
    WebUI --> Server
    Server --> DB
    Example -.->|uses| Widget
```

---

## 🏗️ Architecture

### Directory Structure (Additions)

```
react-feedback-widget/
├── docker-compose.yml           # Root orchestration (NEW)
├── .env.example                 # Environment template (NEW)
├── .env                         # Local environment (git-ignored)
├── Taskfile.yml                 # Updated with deploy tasks
├── taskfiles/
│   ├── Server.yml               # Existing shared tasks
│   ├── Testing.yml              # Existing shared tasks
│   └── Docker.yml               # NEW: Shared Docker tasks
├── docs/
│   └── spec/
│       └── 001.reference-deployment-specification/
│           └── README.md        # This file
├── packages/
│   ├── feedback-server/
│   │   ├── Dockerfile           # Existing
│   │   ├── docker-compose.yml   # Existing (standalone)
│   │   ├── .dockerignore        # Existing
│   │   ├── entrypoint.sh        # NEW
│   │   └── Taskfile.yml         # NEW
│   ├── feedback-server-webui/
│   │   ├── Dockerfile           # NEW
│   │   ├── .dockerignore        # NEW
│   │   ├── entrypoint.sh        # NEW
│   │   └── Taskfile.yml         # Updated with docker tasks
│   ├── feedback-server-cli/
│   │   ├── Dockerfile           # NEW (binary distribution)
│   │   ├── .dockerignore        # NEW
│   │   └── Taskfile.yml         # Updated with docker tasks
│   ├── feedback-example/
│   │   ├── Dockerfile           # NEW
│   │   ├── .dockerignore        # NEW
│   │   ├── entrypoint.sh        # NEW
│   │   └── Taskfile.yml         # NEW
│   ├── react-visual-feedback/
│   │   ├── Dockerfile           # NEW (build + npm publish)
│   │   ├── .dockerignore        # NEW
│   │   └── Taskfile.yml         # Updated with docker tasks
│   └── feedback-server-api/
│       └── Taskfile.yml         # Existing
└── ...
```

### Build Stages

Each Dockerfile follows a consistent multi-stage pattern:

```mermaid
graph LR
    subgraph "Stage 1: Builder"
        Base1[bun:1.3.6-debian] --> Deps[Install Dependencies]
        Deps --> Build[Build Application]
    end

    subgraph "Stage 2: Production"
        Base2[bun:1.3.6-debian] --> ProdDeps[Prod Dependencies]
        ProdDeps --> Copy[Copy Build Artifacts]
        Copy --> Entry[Entrypoint]
    end

    Build --> Copy
```

### Network Topology

```mermaid
graph TB
    subgraph "External Network"
        Host[Host Machine]
    end

    subgraph "feedback-network (bridge)"
        Server[feedback-server<br/>:3000]
        WebUI[feedback-webui<br/>:3001]
        Example[feedback-example<br/>:3002]
        DB[(postgres<br/>:5432)]
    end

    Host -->|3000| Server
    Host -->|3001| WebUI
    Host -->|3002| Example

    Server --> DB
    WebUI --> Server
    Example --> Server
```

---

## 🐳 Docker Configuration

### Base Image Selection

**Image**: `oven/bun:1.3.6-debian`

**Rationale**:

- Bun 1.3.6 is the current stable version with all required features
- Debian base provides curl, wget, and other utilities
- Consistent across all services for layer caching
- Smaller than Alpine for Node.js alternatives, better compatibility

### Dockerfile Pattern

Each service follows this pattern:

```dockerfile
# =============================================================================
# Stage 1: Builder
# =============================================================================
FROM oven/bun:1.3.6-debian AS builder

WORKDIR /app

# Copy package files for dependency caching
COPY package.json bun.lock* ./

# Install all dependencies (including devDependencies for build)
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN bun run build

# =============================================================================
# Stage 2: Production
# =============================================================================
FROM oven/bun:1.3.6-debian AS production

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Copy package files and install production dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create data directories with correct ownership
RUN mkdir -p /data && chown -R appuser:appgroup /data

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/api/health || exit 1

# Expose port
EXPOSE ${PORT:-3000}

# Use dumb-init for proper signal handling
ENTRYPOINT ["/usr/bin/dumb-init", "--", "/entrypoint.sh"]

# Default command
CMD ["bun", "run", "dist/index.js"]
```

### Entrypoint Script Pattern

Each service includes an entrypoint script:

```bash
#!/bin/bash
set -euo pipefail

# =============================================================================
# Entrypoint Script for [Service Name]
# =============================================================================

echo "🚀 Starting [Service Name]..."
echo "   Version: ${APP_VERSION:-unknown}"
echo "   Environment: ${NODE_ENV:-production}"
echo "   Port: ${PORT:-3000}"

# ---------------------------------------------------------------------------
# 1. Volume Permission Check
# ---------------------------------------------------------------------------
check_permissions() {
    local dir=$1
    local required_perms=$2

    if [ -d "$dir" ]; then
        if [ ! -w "$dir" ]; then
            echo "❌ ERROR: Directory $dir is not writable by user $(whoami)"
            echo "   Fix: chown -R $(id -u):$(id -g) $dir"
            exit 1
        fi
        echo "✅ Directory $dir is writable"
    fi
}

# Check data directories
check_permissions "${DATA_DIR:-/data}" "rw"
check_permissions "${UPLOAD_DIR:-/data/uploads}" "rw"

# ---------------------------------------------------------------------------
# 2. Wait for Dependencies
# ---------------------------------------------------------------------------
wait_for_service() {
    local host=$1
    local port=$2
    local timeout=${3:-30}
    local start=$(date +%s)

    echo "⏳ Waiting for $host:$port..."

    while ! nc -z "$host" "$port" 2>/dev/null; do
        local now=$(date +%s)
        local elapsed=$((now - start))

        if [ $elapsed -ge $timeout ]; then
            echo "❌ Timeout waiting for $host:$port after ${timeout}s"
            exit 1
        fi

        sleep 1
    done

    echo "✅ $host:$port is ready"
}

# Wait for database if configured
if [ -n "${DATABASE_HOST:-}" ]; then
    wait_for_service "$DATABASE_HOST" "${DATABASE_PORT:-5432}" 60
fi

# ---------------------------------------------------------------------------
# 3. Run Migrations (if applicable)
# ---------------------------------------------------------------------------
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    echo "📦 Running database migrations..."
    bun run db:migrate || {
        echo "❌ Migration failed"
        exit 1
    }
    echo "✅ Migrations complete"
fi

# ---------------------------------------------------------------------------
# 4. Start Application
# ---------------------------------------------------------------------------
echo "🎯 Starting application..."
exec "$@"
```

---

## 🔧 Configuration

### Environment Variables

All services are configured via a root `.env` file:

```bash
# =============================================================================
# React Visual Feedback - Reference Deployment Configuration
# =============================================================================

# -----------------------------------------------------------------------------
# General Settings
# -----------------------------------------------------------------------------
NODE_ENV=production
TZ=UTC
LOG_LEVEL=info

# -----------------------------------------------------------------------------
# Feedback Server
# -----------------------------------------------------------------------------
FEEDBACK_SERVER_PORT=3000
FEEDBACK_SERVER_HOST=0.0.0.0

# Database
DATABASE_URL=postgres://feedback:${POSTGRES_PASSWORD}@postgres:5432/feedback
DATABASE_HOST=postgres
DATABASE_PORT=5432

# Blob Storage
UPLOAD_DIR=/data/uploads
MAX_UPLOAD_SIZE=104857600

# Authentication
AUTH_ENABLED=true
AUTH_TYPE=apikey
API_KEY=your-secret-api-key-change-me
JWT_SECRET=your-jwt-secret-change-me

# CORS
CORS_ORIGINS=http://localhost:3001,http://localhost:3002

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# -----------------------------------------------------------------------------
# Feedback WebUI
# -----------------------------------------------------------------------------
WEBUI_PORT=3001
WEBUI_API_URL=http://feedback-server:3000

# -----------------------------------------------------------------------------
# Feedback Example
# -----------------------------------------------------------------------------
EXAMPLE_PORT=3002
EXAMPLE_API_URL=http://feedback-server:3000

# -----------------------------------------------------------------------------
# PostgreSQL
# -----------------------------------------------------------------------------
POSTGRES_USER=feedback
POSTGRES_PASSWORD=feedback-secret-password-change-me
POSTGRES_DB=feedback

# -----------------------------------------------------------------------------
# Docker Build
# -----------------------------------------------------------------------------
DOCKER_REGISTRY=ghcr.io/yourusername
DOCKER_TAG=latest
```

### Volume Mounts

| Volume Name     | Mount Path                 | Purpose                            |
| --------------- | -------------------------- | ---------------------------------- |
| `postgres-data` | `/var/lib/postgresql/data` | Database persistence               |
| `feedback-data` | `/data`                    | Blob storage (screenshots, videos) |

---

## 📋 Root Docker Compose

The root `docker-compose.yml` orchestrates all services:

```yaml
# React Visual Feedback - Reference Deployment
# Usage: docker compose up -d

services:
  # ---------------------------------------------------------------------------
  # PostgreSQL Database
  # ---------------------------------------------------------------------------
  postgres:
    image: postgres:16-alpine
    container_name: feedback-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-feedback}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-feedback}
      POSTGRES_DB: ${POSTGRES_DB:-feedback}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "pg_isready -U ${POSTGRES_USER:-feedback} -d ${POSTGRES_DB:-feedback}",
        ]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - feedback-network

  # ---------------------------------------------------------------------------
  # Feedback Server (API)
  # ---------------------------------------------------------------------------
  feedback-server:
    build:
      context: ./packages/feedback-server
      dockerfile: Dockerfile
    container_name: feedback-server
    restart: unless-stopped
    ports:
      - "${FEEDBACK_SERVER_PORT:-3000}:3000"
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      PORT: 3000
      DATABASE_URL: postgres://${POSTGRES_USER:-feedback}:${POSTGRES_PASSWORD:-feedback}@postgres:5432/${POSTGRES_DB:-feedback}
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      UPLOAD_DIR: /data/uploads
      AUTH_ENABLED: ${AUTH_ENABLED:-true}
      AUTH_TYPE: ${AUTH_TYPE:-apikey}
      API_KEY: ${API_KEY:-}
      JWT_SECRET: ${JWT_SECRET:-}
      CORS_ORIGINS: ${CORS_ORIGINS:-*}
      LOG_LEVEL: ${LOG_LEVEL:-info}
      RUN_MIGRATIONS: "true"
    volumes:
      - feedback-data:/data
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
    networks:
      - feedback-network

  # ---------------------------------------------------------------------------
  # Feedback WebUI (Admin Dashboard)
  # ---------------------------------------------------------------------------
  feedback-webui:
    build:
      context: ./packages/feedback-server-webui
      dockerfile: Dockerfile
    container_name: feedback-webui
    restart: unless-stopped
    ports:
      - "${WEBUI_PORT:-3001}:3001"
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      PORT: 3001
      API_URL: http://feedback-server:3000
      VITE_API_URL: http://localhost:${FEEDBACK_SERVER_PORT:-3000}
    depends_on:
      feedback-server:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks:
      - feedback-network

  # ---------------------------------------------------------------------------
  # Feedback Example (Next.js Demo App)
  # ---------------------------------------------------------------------------
  feedback-example:
    build:
      context: ./packages/feedback-example
      dockerfile: Dockerfile
    container_name: feedback-example
    restart: unless-stopped
    ports:
      - "${EXAMPLE_PORT:-3002}:3002"
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      PORT: 3002
      NEXT_PUBLIC_FEEDBACK_SERVER_URL: http://localhost:${FEEDBACK_SERVER_PORT:-3000}
    depends_on:
      feedback-server:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
    networks:
      - feedback-network

# =============================================================================
# Volumes
# =============================================================================
volumes:
  postgres-data:
    driver: local
  feedback-data:
    driver: local

# =============================================================================
# Networks
# =============================================================================
networks:
  feedback-network:
    driver: bridge
```

---

## 🛠️ Taskfile Automation

### Shared Docker Taskfile

New `taskfiles/Docker.yml`:

```yaml
# Shared Docker Tasks
# Include in package Taskfiles for consistent Docker operations

version: "3"

vars:
  IMAGE_NAME: '{{default "app" .IMAGE_NAME}}'
  IMAGE_TAG: '{{default "latest" .IMAGE_TAG}}'
  REGISTRY: '{{default "" .REGISTRY}}'
  CONTAINER_NAME: "{{default .IMAGE_NAME .CONTAINER_NAME}}"
  DOCKERFILE: '{{default "Dockerfile" .DOCKERFILE}}'
  CONTEXT: '{{default "." .CONTEXT}}'

tasks:
  build:
    desc: Build Docker image
    cmds:
      - docker build -t {{.IMAGE_NAME}}:{{.IMAGE_TAG}} -f {{.DOCKERFILE}} {{.CONTEXT}}

  build:nocache:
    desc: Build Docker image without cache
    cmds:
      - docker build --no-cache -t {{.IMAGE_NAME}}:{{.IMAGE_TAG}} -f {{.DOCKERFILE}} {{.CONTEXT}}

  run:
    desc: Run container in foreground
    cmds:
      - docker run --rm -it --name {{.CONTAINER_NAME}} {{.IMAGE_NAME}}:{{.IMAGE_TAG}}

  run:detached:
    desc: Run container in background
    cmds:
      - docker run -d --name {{.CONTAINER_NAME}} {{.IMAGE_NAME}}:{{.IMAGE_TAG}}

  stop:
    desc: Stop running container
    cmds:
      - docker stop {{.CONTAINER_NAME}} 2>/dev/null || true

  logs:
    desc: Show container logs
    cmds:
      - docker logs -f {{.CONTAINER_NAME}}

  shell:
    desc: Open shell in running container
    cmds:
      - docker exec -it {{.CONTAINER_NAME}} /bin/bash

  push:
    desc: Push image to registry
    cmds:
      - docker tag {{.IMAGE_NAME}}:{{.IMAGE_TAG}} {{.REGISTRY}}/{{.IMAGE_NAME}}:{{.IMAGE_TAG}}
      - docker push {{.REGISTRY}}/{{.IMAGE_NAME}}:{{.IMAGE_TAG}}

  clean:
    desc: Remove image and container
    cmds:
      - docker rm -f {{.CONTAINER_NAME}} 2>/dev/null || true
      - docker rmi {{.IMAGE_NAME}}:{{.IMAGE_TAG}} 2>/dev/null || true
```

### Root Taskfile Updates

Add to root `Taskfile.yml`:

```yaml
tasks:
  # ============================================================================
  # Docker Compose Operations
  # ============================================================================

  up:
    desc: Start all services (docker compose up)
    cmds:
      - docker compose up -d

  up:build:
    desc: Rebuild and start all services
    cmds:
      - docker compose up -d --build

  down:
    desc: Stop all services
    cmds:
      - docker compose down

  down:volumes:
    desc: Stop all services and remove volumes
    cmds:
      - docker compose down -v

  restart:
    desc: Restart all services
    cmds:
      - docker compose restart

  logs:
    desc: Show logs from all services
    cmds:
      - docker compose logs -f

  logs:server:
    desc: Show feedback-server logs
    cmds:
      - docker compose logs -f feedback-server

  logs:webui:
    desc: Show feedback-webui logs
    cmds:
      - docker compose logs -f feedback-webui

  logs:example:
    desc: Show feedback-example logs
    cmds:
      - docker compose logs -f feedback-example

  status:
    desc: Show status of all services
    cmds:
      - docker compose ps

  # ============================================================================
  # Build Operations
  # ============================================================================

  docker:build:all:
    desc: Build all Docker images
    cmds:
      - docker compose build

  docker:build:server:
    desc: Build feedback-server image
    cmds:
      - docker compose build feedback-server

  docker:build:webui:
    desc: Build feedback-webui image
    cmds:
      - docker compose build feedback-webui

  docker:build:example:
    desc: Build feedback-example image
    cmds:
      - docker compose build feedback-example

  # ============================================================================
  # Publish Operations
  # ============================================================================

  docker:push:all:
    desc: Push all images to registry
    cmds:
      - task: docker:push:server
      - task: docker:push:webui
      - task: docker:push:example

  docker:push:server:
    desc: Push feedback-server image
    cmds:
      - docker push ${DOCKER_REGISTRY}/feedback-server:${DOCKER_TAG:-latest}

  docker:push:webui:
    desc: Push feedback-webui image
    cmds:
      - docker push ${DOCKER_REGISTRY}/feedback-webui:${DOCKER_TAG:-latest}

  docker:push:example:
    desc: Push feedback-example image
    cmds:
      - docker push ${DOCKER_REGISTRY}/feedback-example:${DOCKER_TAG:-latest}

  # ============================================================================
  # Maintenance Operations
  # ============================================================================

  docker:clean:
    desc: Remove all project containers and images
    cmds:
      - docker compose down --rmi all -v

  docker:prune:
    desc: Clean up dangling images and volumes
    cmds:
      - docker image prune -f
      - docker volume prune -f

  reset:
    desc: Full reset - remove everything and rebuild
    cmds:
      - task: down:volumes
      - task: docker:clean
      - task: up:build
```

---

## 🚀 Usage

### Quick Start

```bash
# 1. Clone and enter directory
git clone https://github.com/yourorg/react-feedback-widget.git
cd react-feedback-widget

# 2. Copy environment template
cp .env.example .env

# 3. Edit environment variables (especially secrets!)
vim .env

# 4. Start all services
task up
# or: docker compose up -d

# 5. Open in browser
#    - WebUI: http://localhost:3001
#    - Example App: http://localhost:3002
#    - API: http://localhost:3000/api/v1/health
```

### Development Mode

```bash
# Start with live rebuild on changes
task up:build

# Watch logs
task logs

# Restart single service
docker compose restart feedback-server

# Rebuild single service
docker compose up -d --build feedback-server
```

### Production Deployment

```bash
# Build production images
task docker:build:all

# Tag and push to registry
DOCKER_REGISTRY=ghcr.io/yourorg DOCKER_TAG=v1.0.0 task docker:push:all

# On production server
docker compose pull
docker compose up -d
```

---

## ⚠️ Requirements

### System Requirements

| Requirement    | Minimum | Recommended |
| -------------- | ------- | ----------- |
| Docker         | 24.0+   | 25.0+       |
| Docker Compose | 2.20+   | 2.24+       |
| RAM            | 2 GB    | 4 GB        |
| Disk Space     | 5 GB    | 20 GB       |
| CPU            | 2 cores | 4 cores     |

### Port Requirements

| Port | Service          | Required |
| ---- | ---------------- | -------- |
| 3000 | feedback-server  | Yes      |
| 3001 | feedback-webui   | Yes      |
| 3002 | feedback-example | Optional |
| 5432 | PostgreSQL       | Internal |

---

## 📐 Design Decisions

### ADR-001: Bun as Runtime

**Decision**: Use Bun 1.3.6 as the runtime for all Node.js services

**Rationale**:

- Faster startup time than Node.js
- Built-in TypeScript support without compilation step
- Native bundler for production builds
- Consistent with existing project tooling

**Consequences**:

- Must use Bun-compatible packages
- Different debugging workflow than Node.js
- Smaller community than Node.js (mitigated by Node compatibility)

### ADR-002: dumb-init for Signal Handling

**Decision**: Use dumb-init as PID 1 in containers

**Rationale**:

- Proper signal forwarding (SIGTERM, SIGINT)
- Zombie process reaping
- Clean shutdown behavior
- Minimal overhead (~1 MB)

**Consequences**:

- Additional package dependency
- Container startup ~1ms slower
- More predictable shutdown behavior

### ADR-003: Non-Root User

**Decision**: Run all services as non-root user (appuser)

**Rationale**:

- Security best practice
- Reduced attack surface
- Compliance with CIS Docker Benchmark
- Works with rootless Docker

**Consequences**:

- Must ensure volume permissions are correct
- Entrypoint must handle permission checks
- Cannot bind to ports < 1024

### ADR-004: Health Check Pattern

**Decision**: All services implement `/api/health` or `/` health endpoints

**Rationale**:

- Docker health checks for orchestration
- Service dependency management
- Load balancer integration
- Monitoring compatibility

**Consequences**:

- Each service must implement health endpoint
- Health checks add minimal overhead
- Container marked unhealthy if endpoint fails

---

## 🔗 Related Documentation

- [Feedback Server Specification](../packages/feedback-server/docs/spec/001.server-software-specification/README.md)
- [WebUI Specification](../packages/feedback-server-webui/docs/spec/001.webui-software-specification/README.md)
- [CLI Specification](../packages/feedback-server-cli/docs/spec/001.cli-software-specification/README.md)

---

**Specification Version**: 1.0.0
**Created by**: GitHub Copilot
**Last Updated**: 2026-01-19
