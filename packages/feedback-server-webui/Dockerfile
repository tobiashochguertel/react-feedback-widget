# =============================================================================
# Feedback Server WebUI Dockerfile
# =============================================================================
# Multi-stage build for the React/Vite admin dashboard
#
# Build:   docker build -t react-visual-feedback/webui .
# Run:     docker run -p 5173:5173 react-visual-feedback/webui
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder
# -----------------------------------------------------------------------------
FROM oven/bun:1.3.6-debian AS builder

WORKDIR /app

# Create minimal workspace package.json to avoid resolving ALL workspace dependencies
# The root package.json has "react-visual-feedback": "workspace:*" which would fail
RUN echo '{"name":"docker-workspace","private":true,"workspaces":["packages/feedback-server-webui","packages/generated/feedback-api-types"]}' > package.json

# Copy lockfile and package files
COPY bun.lock* ./
COPY packages/feedback-server-webui/package.json packages/feedback-server-webui/
COPY packages/generated/feedback-api-types/package.json packages/generated/feedback-api-types/

# Install dependencies
RUN bun install

# Copy source code (exclude tests for production build)
COPY packages/generated/feedback-api-types /app/packages/generated/feedback-api-types
COPY packages/feedback-server-webui/src ./packages/feedback-server-webui/src
COPY packages/feedback-server-webui/public ./packages/feedback-server-webui/public
COPY packages/feedback-server-webui/index.html ./packages/feedback-server-webui/
COPY packages/feedback-server-webui/vite.config.ts ./packages/feedback-server-webui/
COPY packages/feedback-server-webui/tsconfig*.json ./packages/feedback-server-webui/

# Build the application (skip tsc for production, let Vite handle transpilation)
WORKDIR /app/packages/feedback-server-webui
RUN bun run vite build

# -----------------------------------------------------------------------------
# Stage 2: Production (Static File Server)
# -----------------------------------------------------------------------------
FROM oven/bun:1.3.6-debian AS production

LABEL maintainer="React Visual Feedback <feedback@example.com>"
LABEL description="Feedback Server Admin WebUI"
LABEL version="1.0.0"

WORKDIR /app

# Install dumb-init for signal handling
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r appgroup -g 1001 \
    && useradd -r -g appgroup -u 1001 appuser

# Copy built static files
COPY --from=builder /app/packages/feedback-server-webui/dist ./dist

# Copy static file server
COPY packages/feedback-server-webui/server.ts ./server.ts

# Set ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -sf http://localhost:5173/health || exit 1

# Environment defaults
ENV NODE_ENV=production
ENV PORT=5173

# Use dumb-init as PID 1
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the static file server
CMD ["bun", "run", "/app/server.ts"]
