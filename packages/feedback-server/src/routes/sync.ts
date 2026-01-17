/**
 * Sync Routes
 *
 * REST API endpoints for client synchronization.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  processSyncRequest,
  getServerChanges,
  getPendingSyncItems,
  markSyncItemProcessed,
  cleanupSyncQueue,
  type SyncRequest,
  type SyncOptions,
} from "../sync/protocol";

const sync = new Hono();

// Validation schemas
const syncOperationSchema = z.object({
  localId: z.string(),
  operation: z.enum(["create", "update", "delete"]),
  entityType: z.enum(["feedback"]),
  entityId: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string(),
  version: z.number().optional(),
});

const syncRequestSchema = z.object({
  clientId: z.string(),
  projectId: z.string(),
  sessionId: z.string().optional(),
  operations: z.array(syncOperationSchema),
  lastSyncTimestamp: z.string().optional(),
});

/**
 * POST /sync
 * Process sync request from client
 */
sync.post(
  "/",
  zValidator("json", syncRequestSchema),
  async (c) => {
    const request = c.req.valid("json") as SyncRequest;

    // Get optional sync options from headers
    const options: SyncOptions = {};
    const strategyHeader = c.req.header("X-Sync-Strategy");
    if (strategyHeader && ["client-wins", "server-wins", "merge", "manual"].includes(strategyHeader)) {
      (options as { conflictStrategy?: string }).conflictStrategy = strategyHeader;
    }

    try {
      const response = await processSyncRequest(request, options);
      return c.json(response, response.success ? 200 : 207); // 207 Multi-Status for partial success
    } catch (error) {
      console.error("[Sync] Error processing sync request:", error);
      return c.json(
        {
          success: false,
          syncTimestamp: new Date().toISOString(),
          results: [],
          serverChanges: [],
          errors: [
            {
              localId: "",
              code: "SYNC_ERROR",
              message: error instanceof Error ? error.message : "Sync failed",
              retryable: true,
            },
          ],
        },
        500
      );
    }
  }
);

/**
 * GET /sync/changes
 * Get server changes since last sync
 */
sync.get(
  "/changes",
  zValidator(
    "query",
    z.object({
      projectId: z.string(),
      since: z.string().optional(),
    })
  ),
  async (c) => {
    const { projectId, since } = c.req.valid("query");

    try {
      const changes = await getServerChanges(projectId, since);
      return c.json({
        success: true,
        timestamp: new Date().toISOString(),
        changes,
        count: changes.length,
      });
    } catch (error) {
      console.error("[Sync] Error getting changes:", error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Failed to get changes",
        },
        500
      );
    }
  }
);

/**
 * GET /sync/status
 * Get sync queue status
 */
sync.get("/status", async (c) => {
  try {
    const pending = await getPendingSyncItems(1000);
    const pendingByOperation = pending.reduce(
      (acc, item) => {
        acc[item.operation] = (acc[item.operation] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const failedCount = pending.filter((item) => item.retryCount > 0).length;

    return c.json({
      success: true,
      status: {
        pendingCount: pending.length,
        pendingByOperation,
        failedCount,
        oldestPending: pending[0]?.createdAt || null,
      },
    });
  } catch (error) {
    console.error("[Sync] Error getting status:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get status",
      },
      500
    );
  }
});

/**
 * POST /sync/process
 * Manually trigger processing of pending sync items
 */
sync.post(
  "/process",
  zValidator(
    "json",
    z.object({
      limit: z.number().optional().default(100),
    })
  ),
  async (c) => {
    const { limit } = c.req.valid("json");

    try {
      const pending = await getPendingSyncItems(limit);
      let processed = 0;
      let failed = 0;

      for (const item of pending) {
        try {
          await markSyncItemProcessed(item.id);
          processed++;
        } catch {
          failed++;
        }
      }

      return c.json({
        success: true,
        processed,
        failed,
        remaining: pending.length - processed - failed,
      });
    } catch (error) {
      console.error("[Sync] Error processing queue:", error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Failed to process queue",
        },
        500
      );
    }
  }
);

/**
 * DELETE /sync/cleanup
 * Clean up old processed sync items
 */
sync.delete(
  "/cleanup",
  zValidator(
    "query",
    z.object({
      olderThanDays: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 7)),
    })
  ),
  async (c) => {
    const { olderThanDays } = c.req.valid("query");

    try {
      const deleted = await cleanupSyncQueue(olderThanDays);
      return c.json({
        success: true,
        deleted,
        message: `Cleaned up sync items older than ${olderThanDays} days`,
      });
    } catch (error) {
      console.error("[Sync] Error cleaning up:", error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Failed to cleanup",
        },
        500
      );
    }
  }
);

/**
 * POST /sync/batch
 * Batch sync multiple operations efficiently
 */
sync.post(
  "/batch",
  zValidator(
    "json",
    z.object({
      requests: z.array(syncRequestSchema),
    })
  ),
  async (c) => {
    const { requests } = c.req.valid("json");

    try {
      const results = await Promise.all(
        requests.map((req) => processSyncRequest(req as SyncRequest))
      );

      const allSuccess = results.every((r) => r.success);

      return c.json({
        success: allSuccess,
        syncTimestamp: new Date().toISOString(),
        batchResults: results,
        summary: {
          total: requests.length,
          succeeded: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
        },
      });
    } catch (error) {
      console.error("[Sync] Error processing batch:", error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Batch sync failed",
        },
        500
      );
    }
  }
);

export { sync };
export default sync;
