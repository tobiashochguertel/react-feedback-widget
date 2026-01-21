# =============================================================================
# Feedback Server Dockerfile
# =============================================================================
# Multi-stage build for the feedback-server Hono API
# Built from monorepo root context to support workspace dependencies
#
# Build:   docker build -f packages/feedback-server/Dockerfile -t react-visual-feedback/server .
# Run:     docker run -p 3001:3001 react-visual-feedback/server
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder
# -----------------------------------------------------------------------------
FROM oven/bun:1.3.6-debian AS builder

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3) and health check tools
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create a minimal workspace package.json for Docker build
# This avoids pulling in unnecessary workspace dependencies like react-visual-feedback
RUN echo '{"name":"docker-workspace","private":true,"workspaces":["packages/feedback-server","packages/generated/feedback-api-types"]}' > package.json

# Copy lockfile from root
COPY bun.lock* ./

# Copy workspace package.json files for dependency resolution
COPY packages/feedback-server/package.json ./packages/feedback-server/
COPY packages/generated/feedback-api-types/package.json ./packages/generated/feedback-api-types/

# Copy the api-types source (workspace dependency)
COPY packages/generated/feedback-api-types ./packages/generated/feedback-api-types

# Install all dependencies (use --no-save to avoid lockfile changes)
RUN bun install

# Copy server source code
COPY packages/feedback-server/src ./packages/feedback-server/src
COPY packages/feedback-server/tsconfig.json ./packages/feedback-server/

# Build the application
WORKDIR /app/packages/feedback-server
RUN bun run build

# -----------------------------------------------------------------------------
# Stage 2: Production
# -----------------------------------------------------------------------------
FROM oven/bun:1.3.6-debian AS production

LABEL maintainer="React Visual Feedback <feedback@example.com>"
LABEL description="Feedback Server API"
LABEL version="1.0.0"

WORKDIR /app

# Install runtime dependencies, build tools for native modules, and dumb-init
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    dumb-init \
    netcat-openbsd \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r appgroup -g 1001 \
    && useradd -r -g appgroup -u 1001 appuser

# Create minimal workspace package.json for production
RUN echo '{"name":"docker-workspace","private":true,"workspaces":["packages/feedback-server","packages/generated/feedback-api-types"]}' > package.json

# Copy lockfile from root
COPY bun.lock* ./

# Copy workspace package.json files
COPY packages/feedback-server/package.json ./packages/feedback-server/
COPY packages/generated/feedback-api-types/package.json ./packages/generated/feedback-api-types/

# Copy api-types and lockfile from builder (lockfile generated with minimal workspace)
COPY --from=builder /app/packages/generated/feedback-api-types ./packages/generated/feedback-api-types
COPY --from=builder /app/bun.lock ./

# Install production dependencies only (no frozen-lockfile since workspace lockfile differs)
RUN bun install --production \
    && bun pm cache rm

# Copy built files from builder
COPY --from=builder /app/packages/feedback-server/dist ./packages/feedback-server/dist

# Copy entrypoint script
COPY packages/feedback-server/entrypoint.sh /app/entrypoint.sh

# Create directories and set permissions
RUN mkdir -p /app/data /app/uploads \
    && chown -R appuser:appgroup /app \
    && chmod +x /app/entrypoint.sh

# Switch to non-root user
USER appuser

# Set working directory to server package
WORKDIR /app/packages/feedback-server

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -sf http://localhost:3001/api/v1/health || exit 1

# Environment defaults
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0
ENV DATABASE_URL=file:/app/data/feedback.db
ENV UPLOAD_DIR=/app/uploads
ENV LOG_LEVEL=info

# Use dumb-init as PID 1 to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Run entrypoint script which starts the server
CMD ["/app/entrypoint.sh"]
