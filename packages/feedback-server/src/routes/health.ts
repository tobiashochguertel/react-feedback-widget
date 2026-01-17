/**
 * Health check routes
 *
 * Provides health check endpoints for monitoring and orchestration.
 */

import { Hono } from "hono";
import { checkDatabaseHealth } from "../db";
import { checkStorageHealth } from "../storage";

export const healthRouter = new Hono();

const startTime = Date.now();

/**
 * Basic health check
 */
healthRouter.get("/", (c) => {
  return c.json({
    status: "healthy",
    version: "0.1.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Detailed health check with component status
 */
healthRouter.get("/detailed", async (c) => {
  const [dbHealth, storageHealth] = await Promise.all([
    checkDatabaseHealth(),
    checkStorageHealth(),
  ]);

  const allHealthy = dbHealth.healthy && storageHealth.healthy;
  const status = allHealthy ? "healthy" : "degraded";

  return c.json(
    {
      status,
      version: "0.1.0",
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
      components: [
        {
          name: "database",
          status: dbHealth.healthy ? "healthy" : "unhealthy",
          responseTime: dbHealth.responseTime,
          error: dbHealth.error,
        },
        {
          name: "storage",
          status: storageHealth.healthy ? "healthy" : "unhealthy",
          responseTime: storageHealth.responseTime,
          error: storageHealth.error,
        },
      ],
    },
    allHealthy ? 200 : 503
  );
});

/**
 * Readiness probe for Kubernetes
 */
healthRouter.get("/ready", async (c) => {
  const [dbHealth, storageHealth] = await Promise.all([
    checkDatabaseHealth(),
    checkStorageHealth(),
  ]);

  const ready = dbHealth.healthy && storageHealth.healthy;

  return c.json({ ready }, ready ? 200 : 503);
});

/**
 * Liveness probe for Kubernetes
 */
healthRouter.get("/live", (c) => {
  return c.json({ alive: true });
});
