/**
 * Feedback Server
 *
 * A centralized backend service for collecting and managing feedback
 * from multiple WebUI projects using the react-visual-feedback library.
 *
 * @packageDocumentation
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { compress } from "hono/compress";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";

import { feedbackRouter } from "./routes/feedback";
import { videoRouter } from "./routes/video";
import { healthRouter } from "./routes/health";
import { sync } from "./routes/sync";
import { websocketConfig, getWebSocketStats } from "./websocket";
import { errorHandler } from "./middleware/error-handler";
import { rateLimiter } from "./middleware/rate-limiter";
import { apiKeyAuth } from "./middleware/auth";
import { config } from "./config";

// Create Hono app
const app = new Hono();

// Global middleware
app.use("*", logger());
app.use("*", timing());
app.use("*", secureHeaders());
app.use("*", prettyJSON());

if (config.enableCompression) {
  app.use("*", compress());
}

// CORS configuration
app.use(
  "*",
  cors({
    origin: config.corsOrigins,
    allowHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length", "X-Request-Id"],
    maxAge: 86400,
    credentials: true,
  })
);

// Rate limiting
app.use("*", rateLimiter());

// Error handling
app.onError(errorHandler);

// Health routes (no auth required)
app.route("/api/v1/health", healthRouter);

// API Key authentication for protected routes
// Applied after health routes so health checks don't require auth
app.use("/api/v1/feedback/*", apiKeyAuth());
app.use("/api/v1/videos/*", apiKeyAuth());
app.use("/api/v1/sync/*", apiKeyAuth());

// API routes
app.route("/api/v1/feedback", feedbackRouter);
app.route("/api/v1/videos", videoRouter);
app.route("/api/v1/sync", sync);

// WebSocket stats endpoint (HTTP)
app.get("/ws", (c) => {
  return c.json({
    message: "WebSocket endpoint. Connect using ws:// or wss:// protocol.",
    stats: getWebSocketStats(),
    upgradeRequired: true,
  });
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: "Not Found",
      message: `Route ${c.req.method} ${c.req.path} not found`,
      statusCode: 404,
    },
    404
  );
});

// Server info
app.get("/", (c) => {
  return c.json({
    name: "@react-visual-feedback/server",
    version: "0.1.0",
    apiVersion: "v1",
    docs: "/api/v1/docs",
    health: "/api/v1/health",
  });
});

// Export for Bun server with WebSocket support
export default {
  port: config.port,
  hostname: config.host,
  fetch: app.fetch,
  websocket: websocketConfig,
};

// Also export app for testing
export { app };

// Export WebSocket utilities for route handlers
export { websocketConfig, getWebSocketStats } from "./websocket";
