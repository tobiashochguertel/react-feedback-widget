/**
 * Health check routes
 */

import { Hono } from "hono";

export const healthRouter = new Hono();

const startTime = Date.now();

healthRouter.get("/", (c) => {
  return c.json({
    status: "healthy",
    version: "0.1.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get("/detailed", (c) => {
  // TODO: Add database and storage health checks
  return c.json({
    status: "healthy",
    version: "0.1.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    components: [
      {
        name: "database",
        status: "healthy",
        responseTime: 5,
      },
      {
        name: "storage",
        status: "healthy",
        responseTime: 2,
      },
    ],
  });
});

healthRouter.get("/ready", (c) => {
  // TODO: Check if server is ready to accept traffic
  return c.json({ ready: true });
});

healthRouter.get("/live", (c) => {
  return c.json({ alive: true });
});
