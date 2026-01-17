/**
 * WebSocket Server for Real-time Updates
 *
 * Implements WebSocket handling using Bun's native WebSocket API.
 * Provides real-time sync for feedback events across connected clients.
 */

import type { Server, ServerWebSocket } from "bun";
import type { Feedback } from "./db/schema";
import { getServerChanges } from "./sync/protocol";

// Client data attached to each WebSocket connection
export interface ClientData {
  id: string;
  projectId?: string | undefined;
  sessionId?: string | undefined;
  subscribedProjects: Set<string>;
  connectedAt: Date;
  lastPing: Date;
}

// WebSocket message types
export type ClientMessage =
  | { type: "subscribe"; projectId: string; sessionId?: string }
  | { type: "unsubscribe"; projectId: string }
  | { type: "ping" }
  | { type: "auth"; token: string }
  | { type: "sync:request"; lastSyncTimestamp?: string }
  | { type: "sync:ack"; syncTimestamp: string };

export type ServerMessage =
  | { type: "welcome"; clientId: string; timestamp: string }
  | { type: "subscribed"; projectId: string }
  | { type: "unsubscribed"; projectId: string }
  | { type: "pong"; timestamp: string }
  | { type: "error"; message: string; code?: string }
  | { type: "feedback:created"; feedback: Partial<Feedback> }
  | { type: "feedback:updated"; feedback: Partial<Feedback> }
  | { type: "feedback:deleted"; feedbackId: string }
  | { type: "feedback:status"; feedbackId: string; oldStatus: string; newStatus: string }
  | { type: "sync:changes"; changes: unknown[]; timestamp: string }
  | { type: "sync:complete"; timestamp: string; count: number };

// Connected clients storage
const clients = new Map<string, ServerWebSocket<ClientData>>();

// Project subscriptions (projectId -> Set of clientIds)
const projectSubscriptions = new Map<string, Set<string>>();

/**
 * Generate unique client ID
 */
function generateClientId(): string {
  return `ws_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Send message to a specific client
 */
function sendToClient(clientId: string, message: ServerMessage): boolean {
  const client = clients.get(clientId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
    return true;
  }
  return false;
}

/**
 * Broadcast message to all clients subscribed to a project
 */
export function broadcastToProject(projectId: string, message: ServerMessage): number {
  const subscribers = projectSubscriptions.get(projectId);
  if (!subscribers) return 0;

  let sent = 0;
  for (const clientId of subscribers) {
    if (sendToClient(clientId, message)) {
      sent++;
    }
  }
  return sent;
}

/**
 * Broadcast to all connected clients
 */
export function broadcastToAll(message: ServerMessage): number {
  let sent = 0;
  for (const [clientId] of clients) {
    if (sendToClient(clientId, message)) {
      sent++;
    }
  }
  return sent;
}

/**
 * Notify clients of feedback creation
 */
export function notifyFeedbackCreated(feedback: Partial<Feedback>): void {
  if (feedback.projectId) {
    broadcastToProject(feedback.projectId, {
      type: "feedback:created",
      feedback,
    });
  }
}

/**
 * Notify clients of feedback update
 */
export function notifyFeedbackUpdated(feedback: Partial<Feedback>): void {
  if (feedback.projectId) {
    broadcastToProject(feedback.projectId, {
      type: "feedback:updated",
      feedback,
    });
  }
}

/**
 * Notify clients of feedback deletion
 */
export function notifyFeedbackDeleted(feedbackId: string, projectId: string): void {
  broadcastToProject(projectId, {
    type: "feedback:deleted",
    feedbackId,
  });
}

/**
 * Notify clients of status change
 */
export function notifyStatusChanged(
  feedbackId: string,
  projectId: string,
  oldStatus: string,
  newStatus: string
): void {
  broadcastToProject(projectId, {
    type: "feedback:status",
    feedbackId,
    oldStatus,
    newStatus,
  });
}

/**
 * Handle client subscription to a project
 */
function handleSubscribe(ws: ServerWebSocket<ClientData>, projectId: string, sessionId?: string): void {
  const data = ws.data;

  // Add to project subscriptions
  if (!projectSubscriptions.has(projectId)) {
    projectSubscriptions.set(projectId, new Set());
  }
  projectSubscriptions.get(projectId)!.add(data.id);

  // Update client data
  data.subscribedProjects.add(projectId);
  if (sessionId) {
    data.sessionId = sessionId;
  }
  data.projectId = projectId;

  // Send confirmation
  ws.send(
    JSON.stringify({
      type: "subscribed",
      projectId,
    } satisfies ServerMessage)
  );

  console.log(`[WS] Client ${data.id} subscribed to project ${projectId}`);
}

/**
 * Handle client unsubscription from a project
 */
function handleUnsubscribe(ws: ServerWebSocket<ClientData>, projectId: string): void {
  const data = ws.data;

  // Remove from project subscriptions
  const subscribers = projectSubscriptions.get(projectId);
  if (subscribers) {
    subscribers.delete(data.id);
    if (subscribers.size === 0) {
      projectSubscriptions.delete(projectId);
    }
  }

  // Update client data
  data.subscribedProjects.delete(projectId);
  if (data.projectId === projectId) {
    data.projectId = undefined;
  }

  // Send confirmation
  ws.send(
    JSON.stringify({
      type: "unsubscribed",
      projectId,
    } satisfies ServerMessage)
  );

  console.log(`[WS] Client ${data.id} unsubscribed from project ${projectId}`);
}

/**
 * Handle sync request from client via WebSocket
 */
async function handleSyncRequest(
  ws: ServerWebSocket<ClientData>,
  lastSyncTimestamp?: string
): Promise<void> {
  const data = ws.data;

  // Get changes for all subscribed projects
  const allChanges: unknown[] = [];

  for (const projectId of data.subscribedProjects) {
    try {
      const changes = await getServerChanges(projectId, lastSyncTimestamp);
      allChanges.push(...changes);
    } catch (error) {
      console.error(`[WS] Error getting changes for project ${projectId}:`, error);
    }
  }

  // Send changes to client
  const timestamp = new Date().toISOString();
  ws.send(
    JSON.stringify({
      type: "sync:changes",
      changes: allChanges,
      timestamp,
    } satisfies ServerMessage)
  );

  // Send completion message
  ws.send(
    JSON.stringify({
      type: "sync:complete",
      timestamp,
      count: allChanges.length,
    } satisfies ServerMessage)
  );

  console.log(`[WS] Sent ${allChanges.length} sync changes to client ${data.id}`);
}

/**
 * Handle incoming message from client
 */
function handleMessage(ws: ServerWebSocket<ClientData>, message: string): void {
  try {
    const parsed = JSON.parse(message) as ClientMessage;

    switch (parsed.type) {
      case "subscribe":
        handleSubscribe(ws, parsed.projectId, parsed.sessionId);
        break;

      case "unsubscribe":
        handleUnsubscribe(ws, parsed.projectId);
        break;

      case "ping":
        ws.data.lastPing = new Date();
        ws.send(
          JSON.stringify({
            type: "pong",
            timestamp: new Date().toISOString(),
          } satisfies ServerMessage)
        );
        break;

      case "auth":
        // TODO: Implement authentication if needed
        console.log(`[WS] Client ${ws.data.id} sent auth token`);
        break;

      case "sync:request":
        handleSyncRequest(ws, parsed.lastSyncTimestamp);
        break;

      case "sync:ack":
        // Client acknowledged sync, update last sync time
        console.log(`[WS] Client ${ws.data.id} acknowledged sync at ${parsed.syncTimestamp}`);
        break;

      default:
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Unknown message type",
            code: "UNKNOWN_TYPE",
          } satisfies ServerMessage)
        );
    }
  } catch (error) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Invalid JSON message",
        code: "INVALID_JSON",
      } satisfies ServerMessage)
    );
  }
}

/**
 * Clean up client on disconnect
 */
function handleClose(ws: ServerWebSocket<ClientData>): void {
  const data = ws.data;

  // Remove from all project subscriptions
  for (const projectId of data.subscribedProjects) {
    const subscribers = projectSubscriptions.get(projectId);
    if (subscribers) {
      subscribers.delete(data.id);
      if (subscribers.size === 0) {
        projectSubscriptions.delete(projectId);
      }
    }
  }

  // Remove from clients map
  clients.delete(data.id);

  console.log(`[WS] Client ${data.id} disconnected`);
}

/**
 * WebSocket server configuration for Bun
 */
export const websocketConfig = {
  message(ws: ServerWebSocket<ClientData>, message: string | Buffer) {
    const msgStr = typeof message === "string" ? message : message.toString();
    handleMessage(ws, msgStr);
  },

  open(ws: ServerWebSocket<ClientData>) {
    const clientId = generateClientId();
    const now = new Date();

    ws.data = {
      id: clientId,
      subscribedProjects: new Set(),
      connectedAt: now,
      lastPing: now,
    };

    clients.set(clientId, ws);

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: "welcome",
        clientId,
        timestamp: now.toISOString(),
      } satisfies ServerMessage)
    );

    console.log(`[WS] Client ${clientId} connected`);
  },

  close(ws: ServerWebSocket<ClientData>) {
    handleClose(ws);
  },

  error(ws: ServerWebSocket<ClientData>, error: Error) {
    console.error(`[WS] Error for client ${ws.data?.id}:`, error.message);
  },

  // Ping/pong for connection health
  perMessageDeflate: true,
  idleTimeout: 120, // 2 minutes
  maxPayloadLength: 1024 * 64, // 64KB max message
};

/**
 * Get WebSocket server statistics
 */
export function getWebSocketStats(): {
  connectedClients: number;
  projectSubscriptions: Record<string, number>;
  uptimeSeconds: number;
} {
  const projectStats: Record<string, number> = {};
  for (const [projectId, subscribers] of projectSubscriptions) {
    projectStats[projectId] = subscribers.size;
  }

  return {
    connectedClients: clients.size,
    projectSubscriptions: projectStats,
    uptimeSeconds: 0, // Would need to track server start time
  };
}

/**
 * Upgrade HTTP request to WebSocket
 * Use this with Bun.serve's fetch handler
 */
export function upgradeToWebSocket(
  server: Server<ClientData>,
  req: Request
): Response | undefined {
  const success = server.upgrade(req, {
    data: {
      id: "",
      subscribedProjects: new Set(),
      connectedAt: new Date(),
      lastPing: new Date(),
    } as ClientData,
  });

  if (success) {
    // Return undefined to indicate upgrade was successful
    return undefined;
  }

  // Return error response if upgrade failed
  return new Response("WebSocket upgrade failed", { status: 500 });
}
