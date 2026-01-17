# Build stage
FROM oven/bun:1.1-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile --production=false

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1.1-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files and install production dependencies
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create data directory for SQLite
RUN mkdir -p /app/data /app/uploads && \
    chown -R appuser:appgroup /app/data /app/uploads

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD bun run dist/healthcheck.js || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=file:/app/data/feedback.db
ENV UPLOAD_DIR=/app/uploads

# Start the server
CMD ["bun", "run", "dist/index.js"]
