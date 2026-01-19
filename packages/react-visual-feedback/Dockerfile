# ============================================================================
# React Visual Feedback Library - Build Dockerfile
# ============================================================================
# This Dockerfile is for building and testing the library in a consistent
# environment. It does NOT produce a runtime container - this is a library
# meant to be installed as an npm package.
#
# Usage:
#   task docker:build                    # Build the image
#   task docker:test                     # Run tests in container
#   task docker:build:dist               # Build distribution files
# ============================================================================

# Build arguments
ARG BUN_VERSION=1.3.6
ARG NODE_VERSION=22

# ============================================================================
# Stage: base
# ============================================================================
FROM oven/bun:${BUN_VERSION}-debian AS base

LABEL org.opencontainers.image.title="react-visual-feedback-builder"
LABEL org.opencontainers.image.description="Build environment for react-visual-feedback library"
LABEL org.opencontainers.image.vendor="React Visual Feedback"

# Install system dependencies for native modules and Playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    # Build dependencies
    build-essential \
    python3 \
    # Playwright dependencies
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    libx11-xcb1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ============================================================================
# Stage: deps - Install all dependencies
# ============================================================================
FROM base AS deps

# Create minimal workspace package.json for this library only
# The root package.json has workspace dependencies we don't need for building this lib
RUN echo '{"name":"docker-workspace","private":true,"workspaces":["packages/react-visual-feedback"]}' > package.json

# Copy package files for dependency installation
COPY bun.lock* ./
COPY packages/react-visual-feedback/package.json packages/react-visual-feedback/

# Install all dependencies (including devDependencies)
RUN bun install

# ============================================================================
# Stage: builder - Build the library
# ============================================================================
FROM deps AS builder

# Copy source files
COPY packages/react-visual-feedback ./packages/react-visual-feedback

# Build the library
WORKDIR /app/packages/react-visual-feedback
RUN bun run build

# Verify build output
RUN test -d dist && echo "Build successful" || exit 1

# ============================================================================
# Stage: test - Run tests
# ============================================================================
FROM deps AS test

# Copy source and test files
COPY . .

# Install Playwright browsers
RUN bunx playwright install --with-deps chromium

# Default command runs tests
CMD ["bun", "run", "test"]

# ============================================================================
# Stage: e2e - Run E2E tests
# ============================================================================
FROM test AS e2e

# Run E2E tests
CMD ["bun", "run", "test:e2e"]

# ============================================================================
# Stage: dist - Output build artifacts
# ============================================================================
FROM builder AS dist

# Create a minimal image with just the dist folder for artifact extraction
WORKDIR /dist

# Copy built files
RUN cp -r /app/dist/* /dist/ && \
    cp /app/package.json /dist/

# This stage is used for extracting build artifacts:
# docker build --target dist -o type=local,dest=./dist .
CMD ["ls", "-la"]

# ============================================================================
# Stage: docs - Build documentation
# ============================================================================
FROM deps AS docs

COPY . .

# Build documentation if available
CMD ["bun", "run", "docs:build"]

# ============================================================================
# Default target: builder
# ============================================================================
FROM builder AS default
