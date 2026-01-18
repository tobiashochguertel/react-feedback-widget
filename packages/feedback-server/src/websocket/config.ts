/**
 * WebSocket Configuration
 *
 * Provides Bun WebSocket configuration and client data types.
 *
 * @module websocket/config
 */

import type { WebSocketHandler } from 'bun';
import { handleMessage, handleOpen, handleClose, handleError } from './handler';
import { registerClient, unregisterClient } from './broadcaster';

// ============================================================================
// Client Data Types
// ============================================================================

/**
 * Data attached to each WebSocket connection
 */
export interface ClientData {
  /** Unique client identifier */
  id: string;
  /** Project ID (for backward compatibility with old API) */
  projectId?: string;
  /** Session ID (for backward compatibility with old API) */
  sessionId?: string;
  /** Set of channels the client is subscribed to */
  subscribedChannels: Set<string>;
  /** Whether the client has authenticated */
  authenticated: boolean;
  /** When the client connected */
  connectedAt: Date;
  /** Last ping received from client */
  lastPing: Date;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Server version for connection acknowledgment
 */
const SERVER_VERSION = process.env.npm_package_version ?? '1.0.0';

/**
 * Generate a unique client ID
 */
export function generateClientId(): string {
  return `ws_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create initial client data for a new connection
 */
export function createClientData(): ClientData {
  const now = new Date();
  return {
    id: generateClientId(),
    subscribedChannels: new Set(),
    authenticated: false,
    connectedAt: now,
    lastPing: now,
  };
}

/**
 * WebSocket handler configuration for Bun
 *
 * Use this when creating the Bun server:
 *
 * ```typescript
 * Bun.serve({
 *   fetch(req, server) {
 *     if (server.upgrade(req, { data: createClientData() })) {
 *       return; // Upgraded to WebSocket
 *     }
 *     return new Response('Not found', { status: 404 });
 *   },
 *   websocket: websocketConfig,
 * });
 * ```
 */
export const websocketConfig: WebSocketHandler<ClientData> = {
  /**
   * Called when a new WebSocket connection is opened
   */
  open(ws) {
    // Register client in broadcaster
    registerClient(ws);

    // Handle connection
    handleOpen(ws, { serverVersion: SERVER_VERSION });
  },

  /**
   * Called when a message is received
   */
  message(ws, message) {
    // Convert Buffer to string if needed (Bun can send Buffer for binary messages)
    const messageData = typeof message === 'string'
      ? message
      : message instanceof ArrayBuffer
        ? message
        : message.buffer.slice(message.byteOffset, message.byteOffset + message.byteLength);
    handleMessage(ws, messageData);
  },

  /**
   * Called when the connection is closed
   */
  close(ws, code, reason) {
    handleClose(ws, code, reason, {
      onCleanup: (clientId) => {
        unregisterClient(clientId);
      },
    });
  },

  /**
   * Called when a drain event occurs (internal buffer is empty)
   */
  drain(ws) {
    // Optional: Track when buffer is drained
    console.log(`[WS] Buffer drained for client ${ws.data.id}`);
  },

  /**
   * Maximum message size (64KB)
   */
  maxPayloadLength: 64 * 1024,

  /**
   * Enable compression
   */
  perMessageDeflate: true,

  /**
   * Idle timeout (5 minutes)
   * Client should send ping before this timeout
   */
  idleTimeout: 300,
};

// ============================================================================
// Upgrade Helper
// ============================================================================

/**
 * Upgrade an HTTP request to a WebSocket connection
 *
 * @param server - The Bun server instance
 * @param req - The HTTP request
 * @returns true if upgraded, false if not a WebSocket request
 */
export function upgradeToWebSocket(
  server: { upgrade: (req: Request, options: { data: ClientData }) => boolean },
  req: Request
): boolean {
  const url = new URL(req.url);

  // Only upgrade /ws path
  if (url.pathname !== '/ws') {
    return false;
  }

  // Check for WebSocket upgrade header
  const upgradeHeader = req.headers.get('upgrade');
  if (upgradeHeader?.toLowerCase() !== 'websocket') {
    return false;
  }

  // Perform upgrade
  return server.upgrade(req, {
    data: createClientData(),
  });
}

// ============================================================================
// Statistics Export
// ============================================================================

export { getWebSocketStats } from './broadcaster';
