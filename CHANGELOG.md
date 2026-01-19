# Changelog

All notable changes to the React Visual Feedback monorepo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Docker Deployment (002.reference-deployment)

**Infrastructure**

- **Root `docker-compose.yml`** - Full-stack deployment orchestration with:
  - PostgreSQL 16 database with health checks
  - Feedback Server (REST API)
  - Feedback WebUI (Admin Dashboard)
  - Feedback Example (Demo Application)
  - Shared Docker network for service communication
  - Named volumes for data persistence

- **`docker-compose.prod.yml`** - Production overrides with:
  - Resource limits (CPU, memory)
  - JSON logging with rotation
  - Stricter health checks
  - Environment variable requirements
  - Restart policies

**Package Dockerfiles**

- **`packages/feedback-server/Dockerfile`** - Multi-stage build for API server
- **`packages/feedback-server-webui/Dockerfile`** - Static build for admin UI
- **`packages/feedback-example/Dockerfile`** - Next.js application container
- **`packages/react-visual-feedback/Dockerfile`** - Library build/test image
- **`packages/feedback-server-cli/Dockerfile`** - Cross-platform CLI binaries

**Package Docker Compose Files**

- Individual `docker-compose.yml` for each package for standalone operation
- Development and test service configurations
- Shell access for debugging

**Automation**

- **Root `Taskfile.yml`** - Comprehensive task automation with:
  - `task up` / `task down` - Start/stop services
  - `task db:shell` / `task db:backup` / `task db:restore` - Database operations
  - `task health` / `task status` - Health monitoring
  - `task docker:build` / `task docker:push` - Image management
  - `task prune` / `task reset` - Cleanup operations

- **Package Taskfiles** - Docker tasks for each package:
  - Build, run, test, shell access
  - Consistent interface across packages

**Configuration**

- **`.env.example`** - Environment template with all configuration options
- **`.dockerignore`** - Optimized Docker build context

**Documentation**

- **`docs/deployment/README.md`** - Comprehensive deployment guide with:
  - Prerequisites and system requirements
  - Quick start guide (5 steps)
  - Full configuration reference
  - Production deployment checklist
  - Security considerations
  - Backup and restore procedures
  - Monitoring and logging
  - Upgrade procedures

- **`docs/deployment/troubleshooting.md`** - Troubleshooting guide with:
  - Quick diagnostics
  - Container issues resolution
  - Database troubleshooting
  - Network debugging
  - Performance optimization
  - Log analysis
  - Emergency procedures

- **`docs/deployment/security.md`** - Security guide with:
  - Secret management
  - Network security
  - Container hardening
  - Database security
  - TLS configuration
  - Compliance checklist

- **`docs/deployment/diagrams/architecture.md`** - Mermaid diagrams for:
  - Deployment architecture
  - Network topology
  - Data flow
  - Health check flow
  - Security boundaries

### Technical Details

**Base Image**: `oven/bun:1.3.6-debian`  
**Signal Handler**: dumb-init for proper signal forwarding  
**Database**: PostgreSQL 16 (alpine)  
**Orchestration**: Docker Compose with health checks and dependency ordering

---

## Package-specific Changes

For changes to individual packages, see:

- [packages/react-visual-feedback/CHANGELOG.md](packages/react-visual-feedback/CHANGELOG.md)
- [packages/feedback-server/CHANGELOG.md](packages/feedback-server/CHANGELOG.md)
- [packages/feedback-server-webui/CHANGELOG.md](packages/feedback-server-webui/CHANGELOG.md)

---

*Maintained by: @tobiashochguertel*
