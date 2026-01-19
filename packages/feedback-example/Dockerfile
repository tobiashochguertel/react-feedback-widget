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

# Create minimal workspace package.json for example and library
# This avoids resolving all workspace dependencies from root package.json
RUN echo '{"name":"docker-workspace","private":true,"workspaces":["packages/feedback-example","packages/react-visual-feedback"]}' > package.json

# Copy lockfile and package files
COPY bun.lock* ./
COPY packages/feedback-example/package.json packages/feedback-example/
COPY packages/react-visual-feedback/package.json packages/react-visual-feedback/

# Install dependencies
RUN bun install

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM deps AS builder

# Copy pre-built react-visual-feedback library (built locally to avoid memory issues)
COPY packages/react-visual-feedback ./packages/react-visual-feedback

# Copy example app source
COPY packages/feedback-example ./packages/feedback-example

# Build the Next.js app
WORKDIR /app/packages/feedback-example

# Set Next.js to output standalone build
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# Fix standalone node_modules - bun creates symlinks that won't work in production
# Only copy the required runtime dependencies by dereferencing symlinks
RUN cd .next/standalone && \
    # Get the actual symlink targets
    next_target=$(readlink -f /app/packages/feedback-example/node_modules/next 2>/dev/null || echo "") && \
    react_target=$(readlink -f /app/packages/feedback-example/node_modules/react 2>/dev/null || echo "") && \
    react_dom_target=$(readlink -f /app/packages/feedback-example/node_modules/react-dom 2>/dev/null || echo "") && \
    # Remove existing symlinked node_modules
    rm -rf node_modules && \
    mkdir -p node_modules && \
    # Copy actual package files
    [ -n "$next_target" ] && cp -r "$next_target" node_modules/next || true && \
    [ -n "$react_target" ] && cp -r "$react_target" node_modules/react || true && \
    [ -n "$react_dom_target" ] && cp -r "$react_dom_target" node_modules/react-dom || true

# -----------------------------------------------------------------------------
# Stage 3: Production
# -----------------------------------------------------------------------------
FROM node:20-slim AS production

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
COPY --from=builder /app/packages/feedback-example/.next/static ./.next/static

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
