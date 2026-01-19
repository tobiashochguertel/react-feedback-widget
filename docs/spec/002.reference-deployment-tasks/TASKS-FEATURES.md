# Reference Deployment - Feature Tasks

**Version**: 1.0.0
**Created**: 2026-01-19
**Updated**: 2026-01-19

---

## Set 1: Setup & Foundation

### T001 - Create Shared Docker Taskfile

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**: Create a shared Taskfile in `taskfiles/Docker.yml` with reusable Docker tasks that can be included in package Taskfiles.

**Implementation**:

- Create `taskfiles/Docker.yml` with parameterized tasks
- Include tasks: build, build:nocache, run, stop, logs, shell, push, clean
- Use variables: IMAGE_NAME, IMAGE_TAG, REGISTRY, CONTAINER_NAME
- Follow existing pattern from `taskfiles/Server.yml`

**Acceptance Criteria**:

- [ ] File exists at `taskfiles/Docker.yml`
- [ ] Tasks are parameterized via variables
- [ ] Can be included in package Taskfiles
- [ ] All tasks have descriptive help text

**Testing**: Include in a package Taskfile and verify tasks work

**Dependencies**: None

---

### T002 - Create Root .env.example

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**: Create a comprehensive `.env.example` file at the repository root with all configuration variables.

**Implementation**:

- Document all environment variables with comments
- Group by service (postgres, server, webui, example)
- Include sensible defaults where possible
- Mark secrets with "change-me" placeholder

**Acceptance Criteria**:

- [ ] File exists at `.env.example`
- [ ] All services have their variables documented
- [ ] Comments explain each variable
- [ ] Secrets have placeholder values

**Testing**: Copy to `.env` and verify `docker compose config` works

**Dependencies**: None

---

### T003 - Create .dockerignore Template

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**: Create a base `.dockerignore` template that can be copied to each package.

**Implementation**:

- Exclude node_modules, dist, .git, docs
- Exclude test files, coverage reports
- Exclude IDE files (.vscode, .idea)
- Exclude environment files (.env, .env.local)

**Acceptance Criteria**:

- [ ] Template exists (can be in docs or scripts)
- [ ] Excludes all non-essential files
- [ ] Reduces image size significantly

**Testing**: Build image and verify size reduction

**Dependencies**: None

---

### T004 - Create Entrypoint Script Template

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**: Create a base entrypoint script template with common functionality.

**Implementation**:

- Permission check function
- Wait-for-service function (TCP port check)
- Migration runner function
- Startup logging
- Proper signal handling with exec

**Acceptance Criteria**:

- [ ] Template includes all common functions
- [ ] Functions are well-documented
- [ ] Works with dumb-init
- [ ] Handles errors gracefully

**Testing**: Test in a container with various failure scenarios

**Dependencies**: None

---

## Set 2: Package Dockerfiles

### T005 - Update feedback-server Dockerfile

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**: Update the existing Dockerfile to follow the new standard pattern with entrypoint script.

**Implementation**:

- Use Bun 1.3.6-debian base image
- Multi-stage build (builder + production)
- Add dumb-init for signal handling
- Add entrypoint.sh integration
- Non-root user configuration
- Health check endpoint

**Acceptance Criteria**:

- [ ] Uses oven/bun:1.3.6-debian
- [ ] Multi-stage build working
- [ ] Runs as non-root user
- [ ] Health check passes
- [ ] Entrypoint script executes

**Testing**: Build and run container, verify health

**Dependencies**: T003, T004

---

### T006 - Create feedback-webui Dockerfile

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**: Create Dockerfile for the Vite-based React WebUI.

**Implementation**:

- Builder stage: install deps, build Vite app
- Production stage: serve static files with Bun HTTP server
- Or use serve/nginx for static hosting
- Configure for SPA routing (fallback to index.html)

**Acceptance Criteria**:

- [ ] Dockerfile exists at packages/feedback-server-webui/Dockerfile
- [ ] Builds successfully
- [ ] Serves SPA correctly
- [ ] Health check passes
- [ ] Environment variables configurable at runtime

**Testing**: Build, run, access in browser

**Dependencies**: T003, T004

---

### T007 - Create feedback-example Dockerfile

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**: Create Dockerfile for the Next.js example application.

**Implementation**:

- Builder stage: install deps, build Next.js
- Production stage: run Next.js server
- Configure for standalone output if possible
- Handle public env vars for widget

**Acceptance Criteria**:

- [ ] Dockerfile exists at packages/feedback-example/Dockerfile
- [ ] Next.js builds in standalone mode
- [ ] Runs on port 3002
- [ ] Widget loads correctly
- [ ] Can connect to feedback-server

**Testing**: Build, run, submit feedback via widget

**Dependencies**: T003, T004

---

### T008 - Create react-visual-feedback Dockerfile

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**: Create Dockerfile for building and publishing the widget library.

**Implementation**:

- Build stage: compile TypeScript, bundle with Rollup
- Output: dist folder with CJS/ESM builds
- Optional: npm publish step
- This is a build-only container (no runtime)

**Acceptance Criteria**:

- [ ] Dockerfile exists at packages/react-visual-feedback/Dockerfile
- [ ] Builds library successfully
- [ ] Can copy dist artifacts
- [ ] Works for CI builds

**Testing**: Build and verify dist output

**Dependencies**: T003

---

### T009 - Create feedback-server-cli Dockerfile

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**: Create Dockerfile for building CLI binaries.

**Implementation**:

- Build stage: compile with tsup and bun --compile
- Multi-target builds: linux-x64, linux-arm64, darwin-x64, darwin-arm64, windows-x64
- Output binaries to /dist/bin

**Acceptance Criteria**:

- [ ] Dockerfile exists at packages/feedback-server-cli/Dockerfile
- [ ] Builds all platform binaries
- [ ] Binaries are executable
- [ ] Works for CI release workflow

**Testing**: Build and run CLI binary

**Dependencies**: T003

---

### T010 - Create .dockerignore for Each Package

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**: Copy and customize .dockerignore for each package that needs a Dockerfile.

**Implementation**:

- Copy template to each package
- Customize for package-specific needs
- Verify no essential files are excluded

**Acceptance Criteria**:

- [ ] .dockerignore exists in feedback-server
- [ ] .dockerignore exists in feedback-server-webui
- [ ] .dockerignore exists in feedback-example
- [ ] .dockerignore exists in react-visual-feedback
- [ ] .dockerignore exists in feedback-server-cli

**Testing**: Build each image, verify expected files are present

**Dependencies**: T003

---

## Set 3: Entrypoint Scripts

### T011 - Create feedback-server Entrypoint

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**: Create entrypoint script for feedback-server with database wait and migration support.

**Implementation**:

- Wait for PostgreSQL to be ready
- Run database migrations if RUN_MIGRATIONS=true
- Check data directory permissions
- Log startup information

**Acceptance Criteria**:

- [ ] Script at packages/feedback-server/entrypoint.sh
- [ ] Waits for database before starting
- [ ] Runs migrations when configured
- [ ] Handles errors gracefully
- [ ] Logs startup progress

**Testing**: Start with and without database, verify behavior

**Dependencies**: T004

---

### T012 - Create feedback-webui Entrypoint

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**: Create entrypoint script for feedback-webui.

**Implementation**:

- Optional: wait for feedback-server health
- Configure runtime environment (inject API URL)
- Log startup information

**Acceptance Criteria**:

- [ ] Script at packages/feedback-server-webui/entrypoint.sh
- [ ] Works without external dependencies
- [ ] Logs startup progress

**Testing**: Start standalone, verify startup

**Dependencies**: T004

---

### T013 - Create feedback-example Entrypoint

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**: Create entrypoint script for feedback-example Next.js app.

**Implementation**:

- Wait for feedback-server health
- Log startup information
- Pass through environment variables

**Acceptance Criteria**:

- [ ] Script at packages/feedback-example/entrypoint.sh
- [ ] Waits for API server
- [ ] Next.js starts correctly

**Testing**: Start with and without server, verify behavior

**Dependencies**: T004

---

### T014 - Create Shared Entrypoint Utilities

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**: Create a shared library of entrypoint functions that can be sourced by individual scripts.

**Implementation**:

- Create `scripts/docker/entrypoint-utils.sh`
- Functions: wait_for_service, check_permissions, log_info, log_error
- Document usage in comments

**Acceptance Criteria**:

- [ ] Utils script exists
- [ ] Functions are well-documented
- [ ] Can be copied into Docker context or sourced

**Testing**: Source in test script and verify functions

**Dependencies**: None

---

## Set 4: Root Docker Compose

### T015 - Create Root docker-compose.yml

**Status**: 🔲 TODO
**Priority**: 🟢 High

**Description**: Create the main docker-compose.yml at the repository root that orchestrates all services.

**Implementation**:

- Define all services: postgres, feedback-server, feedback-webui, feedback-example
- Configure networks (feedback-network)
- Configure volumes (postgres-data, feedback-data)
- Set up health checks and dependencies
- Use environment variable substitution

**Acceptance Criteria**:

- [ ] File exists at root docker-compose.yml
- [ ] All services defined
- [ ] Health checks configured
- [ ] Dependencies properly ordered
- [ ] `docker compose up -d` works

**Testing**: Full stack deployment test

**Dependencies**: T005-T010

---

### T016 - Create docker-compose.override.yml

**Status**: 🔲 TODO
**Priority**: 🟡 Medium

**Description**: Create development override file with hot-reload volumes and debug settings.

**Implementation**:

- Mount source code volumes for hot reload
- Enable debug logging
- Expose additional ports
- Faster health check intervals

**Acceptance Criteria**:

- [ ] File exists at root docker-compose.override.yml
- [ ] Source volumes mounted
- [ ] Development settings applied

**Testing**: Start with override, verify hot reload works

**Dependencies**: T015

---

### T017 - Configure Volume and Network Setup

**Status**: 🔲 TODO
**Priority**: 🟡 Medium

**Description**: Ensure proper configuration of Docker volumes and networks.

**Implementation**:

- Named volumes for data persistence
- Bridge network for service communication
- Document volume backup procedures

**Acceptance Criteria**:

- [ ] Volumes persist across container restarts
- [ ] Services can communicate via DNS
- [ ] Data survives `docker compose down`

**Testing**: Create data, restart, verify data persists

**Dependencies**: T015

---

## Set 5: Package Taskfiles

### T018 - Update feedback-server Taskfile

**Status**: 🔲 TODO
**Priority**: 🟡 Medium

**Description**: Add Docker tasks to the feedback-server Taskfile.

**Implementation**:

- Include shared Docker Taskfile
- Configure variables (IMAGE_NAME, etc.)
- Add package-specific tasks if needed

**Acceptance Criteria**:

- [ ] Taskfile includes taskfiles/Docker.yml
- [ ] `task docker:build` works
- [ ] `task docker:push` works

**Testing**: Run docker tasks from package directory

**Dependencies**: T001

---

### T019 - Create/Update feedback-webui Taskfile

**Status**: 🔲 TODO
**Priority**: 🟡 Medium

**Description**: Add Docker tasks to the feedback-webui Taskfile.

**Implementation**:

- Update existing Taskfile.yml
- Include shared Docker Taskfile
- Add webui-specific tasks

**Acceptance Criteria**:

- [ ] Docker tasks available
- [ ] Integrates with existing tasks

**Testing**: Run docker tasks from package directory

**Dependencies**: T001

---

### T020 - Create feedback-example Taskfile

**Status**: 🔲 TODO
**Priority**: 🟡 Medium

**Description**: Create Taskfile for feedback-example package with Docker tasks.

**Implementation**:

- Create new Taskfile.yml
- Include shared Docker Taskfile
- Add Next.js-specific tasks (dev, build)

**Acceptance Criteria**:

- [ ] Taskfile.yml exists
- [ ] Docker tasks work
- [ ] Dev and build tasks work

**Testing**: Run all tasks from package directory

**Dependencies**: T001

---

### T021 - Update react-visual-feedback Taskfile

**Status**: 🔲 TODO
**Priority**: 🟡 Medium

**Description**: Add Docker build tasks to react-visual-feedback Taskfile.

**Implementation**:

- Update existing Taskfile.yml
- Add docker:build for library builds
- Add publish tasks

**Acceptance Criteria**:

- [ ] Docker build task works
- [ ] Library builds correctly

**Testing**: Build library via Docker

**Dependencies**: T001

---

### T022 - Update feedback-server-cli Taskfile

**Status**: 🔲 TODO
**Priority**: 🟡 Medium

**Description**: Add Docker tasks to feedback-server-cli Taskfile.

**Implementation**:

- Update existing Taskfile.yml
- Add multi-platform binary build tasks
- Add release workflow tasks

**Acceptance Criteria**:

- [ ] Docker build works
- [ ] Binary builds for all platforms

**Testing**: Build all platform binaries

**Dependencies**: T001

---

### T023 - Update Root Taskfile with Compose Tasks

**Status**: 🔲 TODO
**Priority**: 🟡 Medium

**Description**: Add Docker Compose orchestration tasks to root Taskfile.

**Implementation**:

- Add: up, down, restart, logs, status
- Add: docker:build:all, docker:push:all
- Add: reset, prune

**Acceptance Criteria**:

- [ ] All compose commands available as tasks
- [ ] `task up` starts all services
- [ ] `task down` stops all services

**Testing**: Run full deployment via Taskfile

**Dependencies**: T015, T001

---

### T024 - Create taskfiles/Docker.yml Shared Tasks

**Status**: 🔲 TODO
**Priority**: 🟡 Medium

**Description**: Implement the shared Docker Taskfile as designed in T001.

**Implementation**:

- Duplicate of T001 (marked for consolidation)

**Acceptance Criteria**: Same as T001

**Dependencies**: None

**Note**: Consolidate with T001

---

### T025 - Add Publish Tasks to All Taskfiles

**Status**: 🔲 TODO
**Priority**: 🟡 Medium

**Description**: Add registry push tasks to all package Taskfiles.

**Implementation**:

- Tag images with DOCKER_REGISTRY prefix
- Push to configured registry
- Support for multiple tags (latest, version)

**Acceptance Criteria**:

- [ ] `task docker:push` works in each package
- [ ] Images pushed to registry
- [ ] Multiple tag support

**Testing**: Push to test registry

**Dependencies**: T018-T022

---

## Set 6: Configuration

### T026 - Create Root .env.example

**Status**: 🔲 TODO
**Priority**: 🟡 Medium

**Description**: Same as T002 (consolidate)

**Note**: Consolidate with T002

---

### T027 - Create Package-Specific Env Files

**Status**: ✅ COMPLETE
**Priority**: 🟡 Medium
**Completed**: 2025-01-19

**Description**: Create .env.example files in each package for standalone use.

**Implementation**:

- Each package has its own .env.example
- Document package-specific variables
- Reference root .env for compose deployment

**Acceptance Criteria**:

- [x] .env.example in each package
- [x] Variables documented
- [x] Works for standalone development

**Files Created**:
- `packages/feedback-server-webui/.env.example`
- `packages/feedback-server-cli/.env.example`
- `packages/react-visual-feedback/.env.example`

**Testing**: Run each package with its env file

**Dependencies**: T026

---

### T028 - Add .env to .gitignore

**Status**: ✅ COMPLETE
**Priority**: 🟡 Medium
**Completed**: 2025-01-19

**Description**: Ensure .env files are properly gitignored.

**Implementation**:

- Update root .gitignore
- Add .env, .env.local, .env.\*.local
- Verify .env.example is NOT ignored

**Acceptance Criteria**:

- [x] .env files are ignored
- [x] .env.example files are tracked
- [x] No secrets in git history

**Files Modified**:
- `.gitignore` - Added comprehensive .env patterns with !.env.example exception

**Testing**: Create .env, verify not tracked

**Dependencies**: None

---

### T029 - Create docker-compose.prod.yml

**Status**: 🔲 TODO
**Priority**: 🟡 Medium

**Description**: Create production-specific compose configuration.

**Implementation**:

- Disable debug settings
- Enable restart: always
- Configure resource limits
- Add logging driver configuration

**Acceptance Criteria**:

- [ ] File exists at root
- [ ] Production-ready settings
- [ ] Can be used with -f flag

**Testing**: Deploy with prod config, verify settings

**Dependencies**: T015

---

## Set 7: Testing & Validation

### T030 - Create Build Validation Script

**Status**: ✅ COMPLETE
**Priority**: 🟡 Medium
**Completed**: 2025-01-19

**Description**: Create script to validate all Docker builds.

**Implementation**:

- Script in scripts/docker/validate-builds.sh
- Build each image
- Verify image exists
- Check image size
- Report results

**Acceptance Criteria**:

- [x] Script builds all images
- [x] Reports success/failure
- [x] Can be run in CI

**Files Created**:
- `scripts/docker/validate-builds.sh` (~170 lines)

**Testing**: Run script, verify output

**Dependencies**: T005-T010

---

### T031 - Create Health Check Validation

**Status**: ✅ COMPLETE
**Priority**: 🟡 Medium
**Completed**: 2025-01-19

**Description**: Create script to validate all service health endpoints.

**Implementation**:

- Script in scripts/docker/validate-health.sh
- Start compose stack
- Wait for healthy status
- Check each endpoint
- Report results

**Acceptance Criteria**:

- [x] Validates all services
- [x] Times out appropriately
- [x] Reports clear status

**Files Created**:
- `scripts/docker/validate-health.sh` (~200 lines)

**Testing**: Run with healthy and unhealthy services

**Dependencies**: T015

---

### T032 - Test Full Deployment Cycle

**Status**: ✅ COMPLETE
**Priority**: 🟡 Medium
**Completed**: 2025-01-19

**Description**: Perform end-to-end deployment testing.

**Implementation**:

- Clean start (down -v)
- Build all images
- Start all services
- Verify health
- Create feedback via widget
- Verify in WebUI
- Stop services

**Acceptance Criteria**:

- [x] Full cycle completes without errors
- [x] All features work
- [x] Data persists across restarts

**Files Created**:
- `scripts/docker/integration-test.sh` (~280 lines)

**Testing**: Manual and automated E2E

**Dependencies**: T015-T017

---

### T033 - Add CI/CD Workflow for Docker Builds

**Status**: ✅ COMPLETE
**Priority**: 🟡 Medium
**Completed**: 2025-01-19

**Description**: Create GitHub Actions workflow for Docker image builds.

**Implementation**:

- Workflow at .github/workflows/docker-build.yml
- Build all images on PR
- Push to registry on main merge
- Multi-platform builds (amd64, arm64)

**Acceptance Criteria**:

- [x] Builds on every PR
- [x] Pushes on main
- [x] Uses layer caching (GHA cache)
- [x] Validates compose configs
- [x] Runs integration tests on main

**Files Created**:
- `.github/workflows/docker-build.yml` (~220 lines)

**Features**:
- Matrix build for all 5 packages
- GHCR registry push with proper tagging
- Compose config validation (base, prod, override)
- Integration test job with health checks and API tests

**Testing**: Create PR, verify build

**Dependencies**: T030

---

**Tasks Version**: 1.0.0
**Created by**: GitHub Copilot
**Last Updated**: 2026-01-19
