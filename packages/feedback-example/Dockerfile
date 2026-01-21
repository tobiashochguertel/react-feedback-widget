# syntax=docker/dockerfile:1.7
# =============================================================================
# Feedback Example App Dockerfile
# =============================================================================
# Multi-stage build for the Next.js example application using Bun
#
# Build:   docker build -f packages/feedback-example/Dockerfile -t test-example .
# Run:     docker run -p 3002:3002 test-example
# =============================================================================

# ============================================
# Base stage with tools
# ============================================
ARG BUN_VERSION=1.3.6
FROM oven/bun:${BUN_VERSION}-debian AS base

# Install runtime dependencies
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends wget curl bash findutils tree && apt-get clean && rm -rf /var/lib/apt/lists/*

# ============================================
# Dependencies stage
# ============================================
FROM base AS deps
WORKDIR /workspace
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Create minimal workspace package.json for workspace resolution
RUN echo '{"name":"docker-workspace","private":true,"workspaces":["packages/feedback-example","packages/react-visual-feedback"]}' > package.json

# Copy package manifests for both packages
COPY packages/feedback-example/package.json packages/feedback-example/
COPY packages/react-visual-feedback/package.json packages/react-visual-feedback/

# Debug: Show what we are installing
RUN echo "Workspace package.json:" && cat package.json && \
    echo "" && echo "feedback-example package.json:" && cat packages/feedback-example/package.json && \
    echo "" && echo "react-visual-feedback package.json:" && cat packages/react-visual-feedback/package.json

# Remove any existing node_modules if present
RUN find packages -type d -name node_modules -exec rm -rf {} + 2>/dev/null || true

# Install all dependencies (including devDependencies for building)
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install && \
    echo "Installed dependencies:" && \
    ls -la node_modules/ | head -20 && \
    echo "Package node_modules:" && \
    ls -la packages/feedback-example/node_modules/ | head -20 || true

# ============================================
# Builder stage
# ============================================
FROM base AS builder
WORKDIR /workspace

ARG NODE_ENV=production

# Copy entire project structure
COPY . .

# Copy built dependencies from deps stage (preserves bun symlinks)
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/packages/feedback-example/node_modules ./packages/feedback-example/node_modules
COPY --from=deps /workspace/packages/react-visual-feedback/node_modules ./packages/react-visual-feedback/node_modules

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the react-visual-feedback library first (if not pre-built)
WORKDIR /workspace/packages/react-visual-feedback
RUN if [ ! -d "dist" ]; then \
      echo "Building react-visual-feedback library..." && \
      bun run build; \
    else \
      echo "react-visual-feedback library already built, skipping..."; \
    fi

# Build the Next.js example app
WORKDIR /workspace/packages/feedback-example
RUN --mount=type=cache,target=/workspace/packages/feedback-example/.next/cache \
    echo "Building Next.js app..." && \
    bun run build && \
    echo "Build complete. Standalone output:" && \
    ls -la .next/standalone/ && \
    echo "Standalone node_modules:" && \
    ls -la .next/standalone/node_modules/ | head -10 || true

# ============================================
# Production runner
# ============================================
FROM base AS runner
WORKDIR /workspace

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

# Create non-root user (Debian-based)
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nextjs

# Copy production build artifacts from standalone build
# IMPORTANT: Recreate the monorepo structure to preserve Bun workspace symlinks!
# The standalone build creates symlinks like:
#   node_modules/next -> ../../../node_modules/.bun/next@.../node_modules/next
# These symlinks expect the workspace root structure:
#   /workspace/node_modules/.bun/...
#   /workspace/packages/feedback-example/...

# Copy root workspace node_modules (contains .bun/ with actual packages)
COPY --from=builder --chown=nextjs:nodejs /workspace/node_modules ./node_modules

# Copy standalone output to packages/feedback-example/ to match original structure
# The symlinks in node_modules point to ../../../node_modules/.bun/...
# So from /workspace/packages/feedback-example/node_modules/next
# going up 3 levels reaches /workspace/node_modules/.bun/...
COPY --from=builder --chown=nextjs:nodejs /workspace/packages/feedback-example/.next/standalone ./packages/feedback-example

# Copy static assets
COPY --from=builder --chown=nextjs:nodejs /workspace/packages/feedback-example/.next/static ./packages/feedback-example/.next/static

# Note: public folder is optional - only copy if it exists in your project
# COPY --from=builder --chown=nextjs:nodejs /workspace/packages/feedback-example/public ./packages/feedback-example/public

# ============================================
# DEBUG: Analyze file structure and symlinks
# ============================================
RUN echo "======================================" && \
    echo "DEBUG: Analyzing /workspace structure" && \
    echo "======================================" && \
    echo "" && \
    echo "1. TREE VIEW (4 levels deep):" && \
    echo "-------------------------------------------" && \
    tree -L 4 -a -l /workspace 2>/dev/null | head -100 || find /workspace -maxdepth 4 | head -100 && \
    echo "" && \
    echo "2. ROOT DIRECTORY LISTING:" && \
    echo "-------------------------------------------" && \
    ls -lah /workspace && \
    echo "" && \
    echo "3. FINDING ALL server.js FILES:" && \
    echo "-------------------------------------------" && \
    find /workspace -name "server.js" -type f -ls && \
    echo "" && \
    echo "4. FINDING ALL SYMLINKS:" && \
    echo "-------------------------------------------" && \
    find /workspace -type l -ls 2>/dev/null | head -30 && \
    echo "" && \
    echo "5. CHECKING packages/feedback-example STRUCTURE:" && \
    echo "-------------------------------------------" && \
    ls -lah /workspace/packages/feedback-example/ 2>/dev/null || echo "No packages/feedback-example directory" && \
    echo "" && \
    echo "6. CHECKING packages/feedback-example/node_modules:" && \
    echo "-------------------------------------------" && \
    ls -lah /workspace/packages/feedback-example/node_modules 2>/dev/null | head -15 || echo "No node_modules" && \
    echo "" && \
    echo "7. TESTING SYMLINK: Does next exist?" && \
    echo "-------------------------------------------" && \
    test -e /workspace/packages/feedback-example/node_modules/next && echo "next EXISTS" || echo "next MISSING" && \
    echo "" && \
    echo "8. CHECKING ROOT node_modules/.bun:" && \
    echo "-------------------------------------------" && \
    ls -lah /workspace/node_modules/.bun 2>/dev/null | head -20 || echo "No .bun directory" && \
    echo "" && \
    echo "9. DISK USAGE SUMMARY:" && \
    echo "-------------------------------------------" && \
    du -sh /workspace/* 2>/dev/null | sort -h && \
    echo "" && \
    echo "======================================"

# Copy entrypoint script
COPY --from=builder --chown=nextjs:nodejs /workspace/packages/feedback-example/entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

USER nextjs

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -sf http://localhost:3002/ >/dev/null || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
# Use bun to run server.js to handle bun-specific symlinks
CMD ["bun", "packages/feedback-example/server.js"]
