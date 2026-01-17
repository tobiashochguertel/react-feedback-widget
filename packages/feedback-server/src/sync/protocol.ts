/**
 * Client Sync Protocol
 *
 * Implements a sync protocol for offline-first client synchronization.
 * Supports versioning, conflict resolution, and batch operations.
 */

import { nanoid } from "nanoid";
import { eq, and, isNull, gt, asc, lt, not } from "drizzle-orm";
import { db } from "../db";
import { syncQueue, feedback } from "../db/schema";
import type { SyncQueueItem, Feedback } from "../db/schema";
import {
  broadcastToProject,
  notifyFeedbackCreated,
  notifyFeedbackUpdated,
  notifyFeedbackDeleted,
} from "../websocket";

// Sync protocol message types
export type SyncOperation = "create" | "update" | "delete";

export interface SyncRequest {
  clientId: string;
  projectId: string;
  sessionId?: string;
  operations: SyncOperationItem[];
  lastSyncTimestamp?: string;
}

export interface SyncOperationItem {
  localId: string; // Client-side ID for tracking
  operation: SyncOperation;
  entityType: "feedback"; // Extensible for other entity types
  entityId?: string; // For update/delete operations
  payload?: Record<string, unknown>;
  timestamp: string;
  version?: number;
}

export interface SyncResponse {
  success: boolean;
  syncTimestamp: string;
  results: SyncOperationResult[];
  serverChanges: ServerChange[];
  errors?: SyncError[] | undefined;
}

export interface SyncOperationResult {
  localId: string;
  success: boolean;
  serverId?: string;
  serverVersion?: number;
  error?: string;
}

export interface ServerChange {
  entityType: "feedback";
  entityId: string;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  timestamp: string;
  version: number;
}

export interface SyncError {
  localId: string;
  code: string;
  message: string;
  retryable: boolean;
}

// Conflict resolution strategies
export type ConflictStrategy = "client-wins" | "server-wins" | "merge" | "manual";

export interface SyncOptions {
  conflictStrategy?: ConflictStrategy;
  maxRetries?: number;
  batchSize?: number;
}

const DEFAULT_OPTIONS: SyncOptions = {
  conflictStrategy: "server-wins",
  maxRetries: 3,
  batchSize: 100,
};

/**
 * Process sync request from client
 */
export async function processSyncRequest(
  request: SyncRequest,
  options: SyncOptions = {}
): Promise<SyncResponse> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const syncTimestamp = new Date().toISOString();
  const results: SyncOperationResult[] = [];
  const errors: SyncError[] = [];

  // Process each operation
  for (const op of request.operations) {
    try {
      const result = await processOperation(op, request.projectId, request.sessionId, opts);
      results.push(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      results.push({
        localId: op.localId,
        success: false,
        error: errorMessage,
      });
      errors.push({
        localId: op.localId,
        code: "OPERATION_FAILED",
        message: errorMessage,
        retryable: true,
      });
    }
  }

  // Get server changes since last sync
  const serverChanges = await getServerChanges(
    request.projectId,
    request.lastSyncTimestamp
  );

  return {
    success: errors.length === 0,
    syncTimestamp,
    results,
    serverChanges,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Process a single sync operation
 */
async function processOperation(
  op: SyncOperationItem,
  projectId: string,
  sessionId: string | undefined,
  options: SyncOptions
): Promise<SyncOperationResult> {
  switch (op.operation) {
    case "create":
      return processCreate(op, projectId, sessionId);
    case "update":
      return processUpdate(op, projectId, options);
    case "delete":
      return processDelete(op, projectId);
    default:
      throw new Error(`Unknown operation: ${op.operation}`);
  }
}

/**
 * Process create operation
 */
async function processCreate(
  op: SyncOperationItem,
  projectId: string,
  sessionId: string | undefined
): Promise<SyncOperationResult> {
  if (!op.payload) {
    throw new Error("Payload required for create operation");
  }

  const id = nanoid();
  const now = new Date().toISOString();

  // Extract payload and ensure required fields
  const feedbackData = {
    id,
    projectId,
    sessionId: sessionId || op.payload.sessionId as string || nanoid(),
    title: op.payload.title as string,
    description: op.payload.description as string | undefined,
    type: (op.payload.type as string) || "bug",
    status: (op.payload.status as string) || "pending",
    priority: (op.payload.priority as string) || "medium",
    environment: op.payload.environment as Record<string, unknown> | undefined,
    userEmail: op.payload.userEmail as string | undefined,
    userName: op.payload.userName as string | undefined,
    tags: op.payload.tags as string[] | undefined,
    metadata: op.payload.metadata as Record<string, unknown> | undefined,
    createdAt: now,
    updatedAt: now,
    syncedAt: now,
  };

  await db.insert(feedback).values(feedbackData as typeof feedback.$inferInsert);

  // Notify connected clients
  notifyFeedbackCreated(feedbackData as unknown as Partial<Feedback>);

  // Queue for sync tracking
  await addToSyncQueue(id, "create", feedbackData);

  return {
    localId: op.localId,
    success: true,
    serverId: id,
    serverVersion: 1,
  };
}

/**
 * Process update operation with conflict detection
 */
async function processUpdate(
  op: SyncOperationItem,
  projectId: string,
  options: SyncOptions
): Promise<SyncOperationResult> {
  if (!op.entityId) {
    throw new Error("Entity ID required for update operation");
  }

  // Fetch current server state
  const existing = await db.query.feedback.findFirst({
    where: and(eq(feedback.id, op.entityId), eq(feedback.projectId, projectId)),
  });

  if (!existing) {
    throw new Error(`Feedback not found: ${op.entityId}`);
  }

  // Check for conflicts (version-based)
  const serverVersion = getVersion(existing.updatedAt);
  if (op.version !== undefined && op.version < serverVersion) {
    // Conflict detected - handle based on strategy
    const resolution = await resolveConflict(existing, op, options.conflictStrategy!);
    if (!resolution.apply) {
      return {
        localId: op.localId,
        success: false,
        serverId: op.entityId,
        serverVersion,
        error: "Conflict detected - server version is newer",
      };
    }
  }

  const now = new Date().toISOString();
  const updateData = {
    ...op.payload,
    updatedAt: now,
    syncedAt: now,
  };

  await db
    .update(feedback)
    .set(updateData as Partial<typeof feedback.$inferInsert>)
    .where(eq(feedback.id, op.entityId));

  // Fetch updated record
  const updated = await db.query.feedback.findFirst({
    where: eq(feedback.id, op.entityId),
  });

  // Notify connected clients
  if (updated) {
    notifyFeedbackUpdated(updated as unknown as Partial<Feedback>);
  }

  // Queue for sync tracking
  await addToSyncQueue(op.entityId, "update", updateData);

  return {
    localId: op.localId,
    success: true,
    serverId: op.entityId,
    serverVersion: serverVersion + 1,
  };
}

/**
 * Process delete operation
 */
async function processDelete(
  op: SyncOperationItem,
  projectId: string
): Promise<SyncOperationResult> {
  if (!op.entityId) {
    throw new Error("Entity ID required for delete operation");
  }

  // Verify entity exists and belongs to project
  const existing = await db.query.feedback.findFirst({
    where: and(eq(feedback.id, op.entityId), eq(feedback.projectId, projectId)),
  });

  if (!existing) {
    // Already deleted - consider success
    return {
      localId: op.localId,
      success: true,
      serverId: op.entityId,
    };
  }

  // Delete the record
  await db.delete(feedback).where(eq(feedback.id, op.entityId));

  // Notify connected clients
  notifyFeedbackDeleted(op.entityId, projectId);

  // Queue for sync tracking (soft delete tracking)
  await addToSyncQueue(op.entityId, "delete", { deletedAt: new Date().toISOString() });

  return {
    localId: op.localId,
    success: true,
    serverId: op.entityId,
  };
}

/**
 * Add operation to sync queue for tracking
 */
async function addToSyncQueue(
  feedbackId: string,
  operation: SyncOperation,
  payload: Record<string, unknown>
): Promise<void> {
  const id = nanoid();
  await db.insert(syncQueue).values({
    id,
    feedbackId,
    operation,
    payload,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Get server changes since last sync timestamp
 */
export async function getServerChanges(
  projectId: string,
  lastSyncTimestamp?: string
): Promise<ServerChange[]> {
  const changes: ServerChange[] = [];

  // Build query for feedback changes
  const conditions = [eq(feedback.projectId, projectId)];
  if (lastSyncTimestamp) {
    conditions.push(gt(feedback.updatedAt, lastSyncTimestamp));
  }

  const changedFeedback = await db.query.feedback.findMany({
    where: and(...conditions),
    orderBy: [asc(feedback.updatedAt)],
  });

  for (const item of changedFeedback) {
    changes.push({
      entityType: "feedback",
      entityId: item.id,
      operation: item.syncedAt ? "update" : "create",
      payload: item as unknown as Record<string, unknown>,
      timestamp: item.updatedAt,
      version: getVersion(item.updatedAt),
    });
  }

  // Check sync queue for deletions
  if (lastSyncTimestamp) {
    const deletedItems = await db.query.syncQueue.findMany({
      where: and(
        eq(syncQueue.operation, "delete"),
        gt(syncQueue.createdAt, lastSyncTimestamp)
      ),
      orderBy: [asc(syncQueue.createdAt)],
    });

    for (const item of deletedItems) {
      changes.push({
        entityType: "feedback",
        entityId: item.feedbackId,
        operation: "delete",
        payload: item.payload || {},
        timestamp: item.createdAt,
        version: getVersion(item.createdAt),
      });
    }
  }

  return changes;
}

/**
 * Get pending sync queue items
 */
export async function getPendingSyncItems(
  limit: number = 100
): Promise<SyncQueueItem[]> {
  return db.query.syncQueue.findMany({
    where: isNull(syncQueue.processedAt),
    orderBy: [asc(syncQueue.createdAt)],
    limit,
  });
}

/**
 * Mark sync queue item as processed
 */
export async function markSyncItemProcessed(id: string): Promise<void> {
  await db
    .update(syncQueue)
    .set({ processedAt: new Date().toISOString() })
    .where(eq(syncQueue.id, id));
}

/**
 * Retry failed sync item
 */
export async function retrySyncItem(
  id: string,
  error: string
): Promise<boolean> {
  const item = await db.query.syncQueue.findFirst({
    where: eq(syncQueue.id, id),
  });

  if (!item) return false;

  if (item.retryCount >= (DEFAULT_OPTIONS.maxRetries || 3)) {
    // Max retries exceeded
    return false;
  }

  await db
    .update(syncQueue)
    .set({
      retryCount: item.retryCount + 1,
      lastError: error,
    })
    .where(eq(syncQueue.id, id));

  return true;
}

/**
 * Clean up old processed sync queue items
 */
export async function cleanupSyncQueue(olderThanDays: number = 7): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  const cutoffTimestamp = cutoffDate.toISOString();

  // Delete processed items older than cutoff
  await db
    .delete(syncQueue)
    .where(
      and(
        not(isNull(syncQueue.processedAt)),
        lt(syncQueue.processedAt, cutoffTimestamp)
      )
    );

  return 0; // Drizzle doesn't return affected count easily
}

/**
 * Resolve conflict between server and client versions
 */
async function resolveConflict(
  serverState: Feedback,
  clientOp: SyncOperationItem,
  strategy: ConflictStrategy
): Promise<{ apply: boolean; merged?: Record<string, unknown> }> {
  switch (strategy) {
    case "client-wins":
      return { apply: true };

    case "server-wins":
      return { apply: false };

    case "merge":
      // Simple merge: combine non-conflicting fields
      const merged = {
        ...serverState,
        ...clientOp.payload,
        updatedAt: new Date().toISOString(),
      };
      return { apply: true, merged: merged as unknown as Record<string, unknown> };

    case "manual":
      // Don't auto-resolve - return to client
      return { apply: false };

    default:
      return { apply: false };
  }
}

/**
 * Calculate version number from timestamp
 */
function getVersion(timestamp: string): number {
  return new Date(timestamp).getTime();
}

/**
 * Broadcast sync status to clients
 */
export function broadcastSyncStatus(
  projectId: string,
  status: "syncing" | "synced" | "error",
  details?: string
): void {
  broadcastToProject(projectId, {
    type: "feedback:updated", // Reuse existing message type
    feedback: {
      _syncStatus: status,
      _syncDetails: details,
    } as unknown as Partial<Feedback>,
  });
}
