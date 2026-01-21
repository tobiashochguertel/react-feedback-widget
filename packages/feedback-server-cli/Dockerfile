# ============================================================================
# Feedback Server CLI - Multi-Platform Build Dockerfile
# ============================================================================
# This Dockerfile builds cross-platform CLI binaries using Bun's --compile
# feature. It can produce standalone executables for Linux, macOS, and Windows.
#
# Usage:
#   task docker:build                    # Build all binaries
#   task docker:build:linux              # Build Linux binaries only
#   task docker:run -- --help            # Run CLI in container
# ============================================================================

# Build arguments
ARG BUN_VERSION=1.3.6

# ============================================================================
# Stage: base
# ============================================================================
FROM oven/bun:${BUN_VERSION}-debian AS base

LABEL org.opencontainers.image.title="feedback-server-cli-builder"
LABEL org.opencontainers.image.description="Build environment for feedback-server-cli"
LABEL org.opencontainers.image.vendor="React Visual Feedback"

# Install system dependencies for native modules (keytar requires libsecret)
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    build-essential \
    python3 \
    # keytar dependencies
    libsecret-1-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ============================================================================
# Stage: deps - Install dependencies
# ============================================================================
FROM base AS deps

# Create minimal workspace package.json to avoid resolving ALL workspace dependencies
# The root package.json has "react-visual-feedback": "workspace:*" which would fail
# because we only copy the packages we need
RUN echo '{"name":"docker-workspace","private":true,"workspaces":["packages/feedback-server-cli","packages/generated/feedback-api-types"]}' > package.json

# Copy lockfile and package files
COPY bun.lock* ./
COPY packages/feedback-server-cli/package.json ./packages/feedback-server-cli/
COPY packages/generated/feedback-api-types/package.json ./packages/generated/feedback-api-types/

# Install dependencies - use --no-frozen-lockfile since our minimal workspace
# package.json won't match the lockfile exactly
RUN bun install

# ============================================================================
# Stage: builder - Build TypeScript to JavaScript
# ============================================================================
FROM deps AS builder

# Copy CLI source code
COPY packages/feedback-server-cli/ ./packages/feedback-server-cli/
COPY packages/generated/feedback-api-types/ ./packages/generated/feedback-api-types/

WORKDIR /app/packages/feedback-server-cli

# Build the TypeScript project
RUN bun run build

# ============================================================================
# Stage: binary-builder - Build standalone binaries
# ============================================================================
FROM builder AS binary-builder

# Create bin directory
RUN mkdir -p bin

# Build all platform binaries
# Note: Cross-compilation from Linux may have limitations
RUN bun build ./src/index.ts --compile --target=bun-linux-x64 --outfile ./bin/feedback-cli-linux-x64 && \
    bun build ./src/index.ts --compile --target=bun-linux-arm64 --outfile ./bin/feedback-cli-linux-arm64

# Optional: Build for other platforms (may require native dependencies)
# These are built if the build succeeds, otherwise skipped
RUN bun build ./src/index.ts --compile --target=bun-darwin-x64 --outfile ./bin/feedback-cli-darwin-x64 || true
RUN bun build ./src/index.ts --compile --target=bun-darwin-arm64 --outfile ./bin/feedback-cli-darwin-arm64 || true
RUN bun build ./src/index.ts --compile --target=bun-windows-x64 --outfile ./bin/feedback-cli-windows-x64.exe || true

# ============================================================================
# Stage: binaries - Extract just the binaries
# ============================================================================
FROM debian:bookworm-slim AS binaries

# Install minimal runtime dependencies
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libsecret-1-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /bin

# Copy all built binaries
COPY --from=binary-builder /app/packages/feedback-server-cli/bin/ /binaries/

# List available binaries
CMD ["ls", "-la", "/binaries"]

# ============================================================================
# Stage: runner - Runtime container for Linux
# ============================================================================
FROM debian:bookworm-slim AS runner

# Bring in target architecture
ARG TARGETARCH

LABEL org.opencontainers.image.title="feedback-server-cli"
LABEL org.opencontainers.image.description="Feedback Server CLI - Command-line interface"
LABEL org.opencontainers.image.vendor="React Visual Feedback"

# Install runtime dependencies
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libsecret-1-0 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 1001 appgroup \
    && useradd --uid 1001 --gid appgroup --shell /bin/bash --create-home appuser

# Copy the appropriate binary based on architecture
# TARGETARCH is 'amd64' or 'arm64'
COPY --from=binary-builder /app/packages/feedback-server-cli/bin/ /tmp/binaries/
RUN if [ "$TARGETARCH" = "arm64" ]; then \
      cp /tmp/binaries/feedback-cli-linux-arm64 /usr/local/bin/feedback-cli; \
    else \
      cp /tmp/binaries/feedback-cli-linux-x64 /usr/local/bin/feedback-cli; \
    fi && rm -rf /tmp/binaries

# Make executable
RUN chmod +x /usr/local/bin/feedback-cli

# Switch to non-root user
USER appuser:appgroup

# Set config directory
ENV XDG_CONFIG_HOME=/home/appuser/.config
RUN mkdir -p /home/appuser/.config/feedback-cli

WORKDIR /home/appuser

ENTRYPOINT ["feedback-cli"]
CMD ["--help"]

# ============================================================================
# Stage: test - Run tests
# ============================================================================
FROM deps AS test

# Copy source files
COPY packages/feedback-server-cli/ ./packages/feedback-server-cli/
COPY packages/generated/feedback-api-types/ ./packages/generated/feedback-api-types/

WORKDIR /app/packages/feedback-server-cli

# Run tests
CMD ["bun", "run", "test"]

# ============================================================================
# Default target: runner
# ============================================================================
FROM runner AS default
