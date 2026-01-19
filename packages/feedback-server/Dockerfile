# =============================================================================
# Feedback Server Dockerfile
# =============================================================================
# Multi-stage build for the feedback-server Hono API
#
# Build:   docker build -t react-visual-feedback/server .
# Run:     docker run -p 3001:3001 react-visual-feedback/server
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder
# -----------------------------------------------------------------------------
FROM oven/bun:1.3.6-debian AS builder

WORKDIR /app

# Copy package files for dependency caching
COPY package.json bun.lock* ./

# Install all dependencies (including dev for build)
RUN bun install --frozen-lockfile

# Copy source code
COPY src ./src
COPY tsconfig.json ./
COPY drizzle ./drizzle

# Build the application
RUN bun run build

# -----------------------------------------------------------------------------
# Stage 2: Production
# -----------------------------------------------------------------------------
FROM oven/bun:1.3.6-debian AS production

LABEL maintainer="React Visual Feedback <feedback@example.com>"
LABEL description="Feedback Server API"
LABEL version="1.0.0"

WORKDIR /app

# Install runtime dependencies and dumb-init for proper signal handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    dumb-init \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r appgroup -g 1001 \
    && useradd -r -g appgroup -u 1001 appuser

# Copy package files and install production dependencies only
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production \
    && bun pm cache rm

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle

# Copy entrypoint script and utilities
COPY entrypoint.sh /app/entrypoint.sh
COPY --from=builder /app/node_modules/.bin/drizzle-kit /app/node_modules/.bin/drizzle-kit

# Create directories and set permissions
RUN mkdir -p /app/data /app/uploads \
    && chown -R appuser:appgroup /app \
    && chmod +x /app/entrypoint.sh

# Switch to non-root user
USER appuser

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
