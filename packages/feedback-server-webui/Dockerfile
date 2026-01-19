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

# Copy workspace root files for monorepo context
COPY package.json bun.lock* ./
COPY packages/feedback-server-api/package.json packages/feedback-server-api/

# Copy this package's files
COPY packages/feedback-server-webui/package.json packages/feedback-server-webui/

# Install dependencies
WORKDIR /app/packages/feedback-server-webui
RUN cd /app && bun install --frozen-lockfile

# Copy source code
COPY packages/feedback-server-api /app/packages/feedback-server-api
COPY packages/feedback-server-webui/src ./src
COPY packages/feedback-server-webui/public ./public
COPY packages/feedback-server-webui/index.html ./
COPY packages/feedback-server-webui/vite.config.ts ./
COPY packages/feedback-server-webui/tsconfig*.json ./
COPY packages/feedback-server-webui/tailwind.config.js ./
COPY packages/feedback-server-webui/postcss.config.js ./

# Build the application
RUN bun run build

# -----------------------------------------------------------------------------
# Stage 2: Production (Static File Server)
# -----------------------------------------------------------------------------
FROM oven/bun:1.3.6-debian AS production

LABEL maintainer="React Visual Feedback <feedback@example.com>"
LABEL description="Feedback Server Admin WebUI"
LABEL version="1.0.0"

WORKDIR /app

# Install dumb-init for signal handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r appgroup -g 1001 \
    && useradd -r -g appgroup -u 1001 appuser

# Copy built static files
COPY --from=builder /app/packages/feedback-server-webui/dist ./dist

# Create a simple Bun-based static file server
RUN cat > /app/server.ts << 'EOF'
import { serve } from "bun";
import { readFileSync, existsSync } from "fs";
import { join, extname } from "path";

const PORT = parseInt(process.env.PORT || "5173");
const DIST_DIR = "/app/dist";

const mimeTypes: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    // Health check endpoint
    if (pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Try to serve the requested file
    let filePath = join(DIST_DIR, pathname);
    
    // If path is a directory or doesn't exist, try index.html (SPA fallback)
    if (!existsSync(filePath) || pathname === "/") {
      filePath = join(DIST_DIR, "index.html");
    }

    try {
      const content = readFileSync(filePath);
      const ext = extname(filePath);
      const contentType = mimeTypes[ext] || "application/octet-stream";
      
      return new Response(content, {
        headers: { "Content-Type": contentType },
      });
    } catch (e) {
      // Fallback to index.html for SPA routing
      try {
        const indexContent = readFileSync(join(DIST_DIR, "index.html"));
        return new Response(indexContent, {
          headers: { "Content-Type": "text/html" },
        });
      } catch {
        return new Response("Not Found", { status: 404 });
      }
    }
  },
});

console.log(`WebUI server running on port ${PORT}`);
EOF

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
