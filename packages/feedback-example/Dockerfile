# =============================================================================
# Feedback Example App Dockerfile
# =============================================================================
# Multi-stage build for the Next.js example application
#
# Build:   docker build -t react-visual-feedback/example .
# Run:     docker run -p 3002:3002 react-visual-feedback/example
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM oven/bun:1.3.6-debian AS deps

WORKDIR /app

# Copy workspace package files
COPY package.json bun.lock* ./
COPY packages/feedback-example/package.json packages/feedback-example/
COPY packages/react-visual-feedback/package.json packages/react-visual-feedback/

# Install dependencies
RUN bun install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM oven/bun:1.3.6-debian AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/feedback-example/node_modules ./packages/feedback-example/node_modules

# Copy source files
COPY packages/react-visual-feedback ./packages/react-visual-feedback
COPY packages/feedback-example ./packages/feedback-example

# Build the react-visual-feedback library first
WORKDIR /app/packages/react-visual-feedback
RUN bun run build

# Build the Next.js app
WORKDIR /app/packages/feedback-example

# Set Next.js to output standalone build
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# -----------------------------------------------------------------------------
# Stage 3: Production
# -----------------------------------------------------------------------------
FROM oven/bun:1.3.6-debian AS production

LABEL maintainer="React Visual Feedback <feedback@example.com>"
LABEL description="Feedback Example Next.js Application"
LABEL version="1.0.0"

WORKDIR /app

# Install dumb-init and runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r appgroup -g 1001 \
    && useradd -r -g appgroup -u 1001 appuser

# Copy standalone build from builder
COPY --from=builder /app/packages/feedback-example/.next/standalone ./
COPY --from=builder /app/packages/feedback-example/.next/static ./packages/feedback-example/.next/static
COPY --from=builder /app/packages/feedback-example/public ./packages/feedback-example/public

# Copy entrypoint script
COPY packages/feedback-example/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Set ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -sf http://localhost:3002/api/health || exit 1

# Environment defaults
ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME=0.0.0.0

# Use dumb-init as PID 1
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Run entrypoint script
CMD ["/app/entrypoint.sh"]
