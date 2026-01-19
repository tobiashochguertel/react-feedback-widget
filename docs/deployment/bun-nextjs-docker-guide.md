# Bun + Next.js Docker Guide

**Version**: 1.0.0
**Last Updated**: 2026-01-19

This guide explains how to properly Dockerize Next.js applications that use Bun in a monorepo/workspace setup. The key challenge is preserving Bun's workspace symlinks in production containers.

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Implementation Guide](#implementation-guide)
- [Complete Examples](#complete-examples)
  - [Example 1: markdown-viewer](#example-1-markdown-viewer)
  - [Example 2: feedback-example](#example-2-feedback-example)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## The Problem

### Bun Workspace Symlinks

When using Bun in a monorepo/workspace, `bun install` creates symlinks in `node_modules` that point to a central `.bun/` cache directory using **relative paths**:

```
packages/my-app/node_modules/next -> ../../../node_modules/.bun/next@14.2.35+.../node_modules/next
```

This means:

- From `packages/my-app/node_modules/next`
- Going up 3 levels (`../../../`) reaches the workspace root
- Then down into `node_modules/.bun/next@version/node_modules/next`

### What Breaks in Docker

When you copy the Next.js standalone output to a flat directory in Docker:

```dockerfile
# ❌ BROKEN: Copies standalone to /app but symlinks point to ../../../node_modules/.bun/
COPY --from=builder /workspace/packages/my-app/.next/standalone /app
```

The symlinks break because:

- Symlink target: `../../../node_modules/.bun/next@14.2.35.../node_modules/next`
- From `/app/node_modules/next`, going up 3 levels reaches `/` (root)
- `/node_modules/.bun/...` doesn't exist → **Module not found!**

### Error Symptoms

```
Error: Cannot find module 'next/dist/server/next-server'
Error: ENOENT: no such file or directory, stat '/node_modules/.bun/next@14.2.35...'
```

---

## The Solution

### Recreate the Workspace Structure

The solution is to **recreate the monorepo workspace structure** in the production container:

```dockerfile
# ✅ WORKS: Preserve the workspace structure
WORKDIR /workspace

# Copy root node_modules (contains .bun/ with actual packages)
COPY --from=builder /workspace/node_modules ./node_modules

# Copy standalone to the SAME relative path as in the build
COPY --from=builder /workspace/packages/my-app/.next/standalone ./packages/my-app
```

Now the symlinks resolve correctly:

- From `/workspace/packages/my-app/node_modules/next`
- Going up 3 levels reaches `/workspace`
- `/workspace/node_modules/.bun/next@version/...` **exists!** ✓

### Key Principles

1. **Use `/workspace` as WORKDIR** (matching monorepo root)
2. **Copy root `node_modules`** (contains `.bun/` cache with actual packages)
3. **Copy standalone to `packages/<app>/`** (matching original path)
4. **Use `bun` to run server.js** (handles bun-specific features)

---

## Implementation Guide

### Step-by-Step Dockerfile Structure

```dockerfile
# syntax=docker/dockerfile:1.7

# ============================================
# Base stage with tools
# ============================================
ARG BUN_VERSION=1.3.6
FROM oven/bun:${BUN_VERSION}-debian AS base

# Install runtime dependencies
RUN apt-get update && apt-get install -y wget curl bash && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# ============================================
# Dependencies stage
# ============================================
FROM base AS deps
WORKDIR /workspace

# Create minimal workspace package.json
RUN echo '{"name":"workspace","private":true,"workspaces":["packages/*"]}' > package.json

# Copy package manifests for workspace packages
COPY packages/my-app/package.json packages/my-app/
COPY packages/shared-lib/package.json packages/shared-lib/

# Install dependencies (creates symlinks in .bun/)
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install

# ============================================
# Builder stage
# ============================================
FROM base AS builder
WORKDIR /workspace

# Copy full project
COPY . .

# Copy installed dependencies from deps stage
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/packages/my-app/node_modules ./packages/my-app/node_modules

# Build the application
WORKDIR /workspace/packages/my-app
RUN bun run build

# ============================================
# Production runner
# ============================================
FROM base AS runner
WORKDIR /workspace  # ← CRITICAL: Use /workspace to match structure

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nextjs

# CRITICAL: Copy root node_modules (contains .bun/ with actual packages)
COPY --from=builder --chown=nextjs:nodejs /workspace/node_modules ./node_modules

# CRITICAL: Copy standalone to packages/<app>/ to preserve relative paths
COPY --from=builder --chown=nextjs:nodejs /workspace/packages/my-app/.next/standalone ./packages/my-app

# Copy static assets
COPY --from=builder --chown=nextjs:nodejs /workspace/packages/my-app/.next/static ./packages/my-app/.next/static

# Optional: Copy public folder if it exists
# COPY --from=builder --chown=nextjs:nodejs /workspace/packages/my-app/public ./packages/my-app/public

USER nextjs
EXPOSE 3000

# Use bun to run server.js (not node)
CMD ["bun", "packages/my-app/server.js"]
```

### Next.js Configuration

Ensure your `next.config.js` has standalone output enabled:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // ... other config
};

module.exports = nextConfig;
```

### Entrypoint Script (Optional)

```bash
#!/usr/bin/env bash
set -e

# Change to the app directory and run with bun
cd /workspace/packages/my-app
exec bun server.js
```

---

## Complete Examples

### Example 1: markdown-viewer

This is a reference implementation from the `hochguertel.work/entrypoint` repository.

**Project Structure:**

```
/workspace/
├── package.json           # Workspace root
├── node_modules/
│   └── .bun/              # Actual packages live here
├── packages/
│   └── viewer/
│       ├── package.json
│       ├── .next/
│       │   └── standalone/
│       │       └── viewer/
│       │           ├── server.js
│       │           └── node_modules/
│       │               └── next -> ../../../node_modules/.bun/next@14.2.35+.../node_modules/next
```

**Dockerfile:**

```dockerfile
# syntax=docker/dockerfile:1.7

ARG BUN_VERSION=1.3.6
FROM oven/bun:${BUN_VERSION}-debian AS base
RUN apt-get update && apt-get install -y wget curl bash findutils tree && apt-get clean

FROM base AS deps
WORKDIR /workspace
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

COPY package.json bun.lock* bunfig.toml tsconfig.json ./
ADD bin/ ./bin/
COPY packages/ ./packages/

RUN find packages -type d -name node_modules -exec rm -rf {} + 2>/dev/null || true
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install && bun run install:all

FROM base AS builder
WORKDIR /workspace

COPY . .
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/packages/viewer/node_modules ./packages/viewer/node_modules

ENV NEXT_TELEMETRY_DISABLED=1
RUN --mount=type=cache,target=/workspace/packages/viewer/.next/cache \
    bun run build

FROM base AS runner
WORKDIR /workspace

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN groupadd -g 1001 nodejs && useradd -r -u 1001 -g nodejs nextjs

# CRITICAL: Preserve workspace structure
COPY --from=builder --chown=nextjs:nodejs /workspace/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /workspace/packages/viewer/.next/standalone/viewer ./packages/viewer
COPY --from=builder --chown=nextjs:nodejs /workspace/packages/viewer/.next/static ./packages/viewer/.next/static
COPY --from=builder --chown=nextjs:nodejs /workspace/packages/viewer/public ./packages/viewer/public
COPY --from=builder --chown=nextjs:nodejs /workspace/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["bun", "packages/viewer/server.js"]
```

---

### Example 2: feedback-example

This is the Next.js example app from the React Visual Feedback project.

**Project Structure:**

```
/workspace/
├── package.json                      # (created in deps stage)
├── node_modules/
│   └── .bun/                         # Actual packages
├── packages/
│   ├── feedback-example/
│   │   ├── package.json
│   │   └── .next/
│   │       └── standalone/
│   │           ├── server.js
│   │           └── node_modules/
│   │               └── next -> ../../../node_modules/.bun/next@14.2.35+...
│   └── react-visual-feedback/
│       └── package.json              # Library dependency
```

**Dockerfile:**

```dockerfile
# syntax=docker/dockerfile:1.7

ARG BUN_VERSION=1.3.6
FROM oven/bun:${BUN_VERSION}-debian AS base
RUN apt-get update && apt-get install -y wget curl bash findutils tree && apt-get clean && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /workspace
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Create minimal workspace for bun
RUN echo '{"name":"docker-workspace","private":true,"workspaces":["packages/feedback-example","packages/react-visual-feedback"]}' > package.json

COPY packages/feedback-example/package.json packages/feedback-example/
COPY packages/react-visual-feedback/package.json packages/react-visual-feedback/

RUN find packages -type d -name node_modules -exec rm -rf {} + 2>/dev/null || true
RUN --mount=type=cache,target=/root/.bun/install/cache bun install

FROM base AS builder
WORKDIR /workspace

COPY . .
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/packages/feedback-example/node_modules ./packages/feedback-example/node_modules
COPY --from=deps /workspace/packages/react-visual-feedback/node_modules ./packages/react-visual-feedback/node_modules

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build library first (if needed)
WORKDIR /workspace/packages/react-visual-feedback
RUN if [ ! -d "dist" ]; then bun run build; fi

# Build Next.js app
WORKDIR /workspace/packages/feedback-example
RUN --mount=type=cache,target=/workspace/packages/feedback-example/.next/cache bun run build

FROM base AS runner
WORKDIR /workspace

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

RUN groupadd -g 1001 nodejs && useradd -r -u 1001 -g nodejs nextjs

# CRITICAL: Preserve workspace structure
COPY --from=builder --chown=nextjs:nodejs /workspace/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /workspace/packages/feedback-example/.next/standalone ./packages/feedback-example
COPY --from=builder --chown=nextjs:nodejs /workspace/packages/feedback-example/.next/static ./packages/feedback-example/.next/static

COPY --from=builder --chown=nextjs:nodejs /workspace/packages/feedback-example/entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

USER nextjs
EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -sf http://localhost:3002/ >/dev/null || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["bun", "packages/feedback-example/server.js"]
```

**entrypoint.sh:**

```bash
#!/usr/bin/env bash
set -e

cd /workspace/packages/feedback-example
exec bun server.js
```

---

## Troubleshooting

### Debug: Verify Symlinks in Container

Add this debug step to your Dockerfile to verify symlinks are resolving:

```dockerfile
RUN echo "Testing symlink resolution..." && \
    test -e /workspace/packages/my-app/node_modules/next && \
      echo "✓ next EXISTS" || echo "✗ next MISSING" && \
    ls -la /workspace/node_modules/.bun | head -10
```

### Common Issues

#### 1. "Cannot find module 'next'"

**Cause:** Symlinks not resolving because workspace structure isn't preserved.

**Solution:** Ensure you're copying to `packages/<app>/` not just `/app/`:

```dockerfile
# ✅ Correct
COPY --from=builder /workspace/packages/my-app/.next/standalone ./packages/my-app

# ❌ Wrong
COPY --from=builder /workspace/packages/my-app/.next/standalone /app
```

#### 2. "ENOENT: no such file or directory"

**Cause:** Root `node_modules/.bun/` not copied.

**Solution:** Copy root node_modules first:

```dockerfile
COPY --from=builder /workspace/node_modules ./node_modules
```

#### 3. Permission errors

**Cause:** Non-root user can't access files.

**Solution:** Use `--chown` when copying:

```dockerfile
COPY --from=builder --chown=nextjs:nodejs /workspace/node_modules ./node_modules
```

#### 4. Static assets not loading

**Cause:** `.next/static` not copied separately.

**Solution:** Copy static assets:

```dockerfile
COPY --from=builder /workspace/packages/my-app/.next/static ./packages/my-app/.next/static
```

### Debug Commands

```bash
# Check structure inside container
docker run --rm -it my-image tree -L 4 /workspace

# Check symlinks
docker run --rm -it my-image find /workspace -type l -ls

# Test if next module exists
docker run --rm -it my-image test -e /workspace/packages/my-app/node_modules/next && echo "EXISTS" || echo "MISSING"
```

---

## Best Practices

### 1. Always Use `/workspace` as WORKDIR

```dockerfile
WORKDIR /workspace
```

This matches the monorepo root and ensures relative paths work.

### 2. Copy node_modules BEFORE standalone

```dockerfile
# 1. First: root node_modules
COPY --from=builder /workspace/node_modules ./node_modules

# 2. Then: standalone output
COPY --from=builder /workspace/packages/my-app/.next/standalone ./packages/my-app
```

### 3. Use Bun to Run server.js

```dockerfile
CMD ["bun", "packages/my-app/server.js"]
```

Node.js may have issues with bun-specific symlinks. Use bun for consistency.

### 4. Add Debug Output During Build

Include debug output to verify structure:

```dockerfile
RUN echo "Checking symlinks..." && \
    find /workspace -type l -ls | head -20
```

### 5. Use .dockerignore

Create a `.dockerignore` to exclude unnecessary files:

```
node_modules
.next
dist
.git
*.log
```

### 6. Multi-stage Builds for Smaller Images

The examples use multi-stage builds:

1. `base` - Common dependencies
2. `deps` - Install dependencies
3. `builder` - Build application
4. `runner` - Production image (smallest)

---

## Summary

| Step | What                                 | Why                                   |
| ---- | ------------------------------------ | ------------------------------------- |
| 1    | Use `/workspace` WORKDIR             | Match monorepo structure              |
| 2    | Copy root `node_modules`             | Contains `.bun/` with actual packages |
| 3    | Copy standalone to `packages/<app>/` | Preserve relative symlink paths       |
| 4    | Use `bun` to run                     | Handles bun-specific features         |

**The Key Insight:** Bun's workspace symlinks use relative paths. If you change the directory structure in Docker, the symlinks break. The solution is to recreate the same structure.

---

**Document Version**: 1.0.0
**Created**: 2026-01-19
**Maintained by**: React Visual Feedback Team
