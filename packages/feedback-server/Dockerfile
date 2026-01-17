# Build stage
FROM oven/bun:1.3-debian AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile --production=false

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1.3-debian AS production

WORKDIR /app

# Install curl for health checks and create non-root user
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r appgroup && useradd -r -g appgroup appuser

# Copy package files and install production dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create data directory for SQLite and uploads
RUN mkdir -p /app/data /app/uploads && \
    chown -R appuser:appgroup /app/data /app/uploads

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check - uses curl to hit the health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/v1/health || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=file:/app/data/feedback.db
ENV UPLOAD_DIR=/app/uploads

# Start the server
CMD ["bun", "run", "dist/index.js"]
