/**
 * WebSocket handler for real-time updates
 */

import type { Context } from "hono";

/**
 * WebSocket handler for real-time sync
 *
 * Handles:
 * - Client connections
 * - Feedback updates broadcasting
 * - Status changes
 * - Sync events
 */
export const websocketHandler = (c: Context) => {
  // TODO: Implement WebSocket handling with Bun's native WebSocket
  // This is a placeholder that returns upgrade required response
  return c.json(
    {
      error: "Upgrade Required",
      message: "WebSocket connection required. Use ws:// or wss:// protocol.",
    },
    426
  );
};

// WebSocket event types for TypeScript
export interface WebSocketEvents {
  // Client -> Server
  subscribe: {
    type: "subscribe";
    projectId: string;
    sessionId?: string;
  };
  unsubscribe: {
    type: "unsubscribe";
    projectId: string;
  };
  ping: {
    type: "ping";
  };

  // Server -> Client
  feedbackCreated: {
    type: "feedback:created";
    feedback: unknown; // Will be typed with Feedback model
  };
  feedbackUpdated: {
    type: "feedback:updated";
    feedback: unknown;
  };
  feedbackDeleted: {
    type: "feedback:deleted";
    feedbackId: string;
  };
  statusChanged: {
    type: "feedback:status";
    feedbackId: string;
    oldStatus: string;
    newStatus: string;
  };
  pong: {
    type: "pong";
    timestamp: string;
  };
  error: {
    type: "error";
    message: string;
    code?: string;
  };
}
