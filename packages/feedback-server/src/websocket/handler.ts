/**
 * WebSocket Message Handler
 *
 * Routes validated commands to appropriate handlers with type safety.
 *
 * @module websocket/handler
 */

import type { ServerWebSocket } from 'bun';
import type {
  SubscribeCommand,
  UnsubscribeCommand,
  PingCommand,
  AuthenticateCommand,
} from '@feedback/api-types';

import { parseAndValidateCommand, type ValidationResult } from './validator';
import {
  createPongEvent,
  createErrorEvent,
  createConnectionAckEvent,
  createSubscriptionConfirmedEvent,
} from './types';
import type { ClientData } from './config';

// ============================================================================
// Handler Types
// ============================================================================

/**
 * Context provided to command handlers
 */
export interface HandlerContext {
  /** The WebSocket connection */
  ws: ServerWebSocket<ClientData>;
  /** Logger function */
  log: (message: string, ...args: unknown[]) => void;
}

/**
 * Command handler function signature
 */
export type CommandHandler<T> = (command: T, context: HandlerContext) => void | Promise<void>;

// ============================================================================
// Command Handlers
// ============================================================================

/**
 * Handle subscribe command
 */
export const handleSubscribe: CommandHandler<SubscribeCommand> = (command, { ws, log }) => {
  const { channel, filters } = command;
  const { id, subscribedChannels } = ws.data;

  // Add channel to subscribed channels
  subscribedChannels.add(channel);

  log(`Client ${id} subscribed to channel: ${channel}${filters ? ` with filters` : ''}`);

  // Send confirmation event
  const event = createSubscriptionConfirmedEvent(channel);
  ws.send(JSON.stringify(event));
};

/**
 * Handle unsubscribe command
 */
export const handleUnsubscribe: CommandHandler<UnsubscribeCommand> = (command, { ws, log }) => {
  const { channel } = command;
  const { id, subscribedChannels } = ws.data;

  // Remove channel from subscribed channels
  subscribedChannels.delete(channel);

  log(`Client ${id} unsubscribed from channel: ${channel}`);

  // No confirmation event for unsubscribe in the new spec
  // Client can send another subscribe to re-join
};

/**
 * Handle ping command
 */
export const handlePing: CommandHandler<PingCommand> = (_command, { ws, log }) => {
  const { id } = ws.data;

  // Update last ping time
  ws.data.lastPing = new Date();

  log(`Client ${id} ping, sending pong`);

  // Send pong event
  const event = createPongEvent();
  ws.send(JSON.stringify(event));
};

/**
 * Handle authenticate command
 */
export const handleAuthenticate: CommandHandler<AuthenticateCommand> = (command, { ws, log }) => {
  const { token } = command;
  const { id } = ws.data;

  // TODO: Implement actual authentication
  // For now, just mark as authenticated if token is provided
  if (token) {
    ws.data.authenticated = true;
    log(`Client ${id} authenticated`);
  } else {
    const event = createErrorEvent('UNAUTHORIZED', 'Authentication failed: No token provided');
    ws.send(JSON.stringify(event));
  }
};

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Handle incoming WebSocket message
 *
 * Parses, validates, and routes the message to the appropriate handler.
 *
 * @param ws - The WebSocket connection
 * @param data - Raw message data (string or ArrayBuffer)
 * @param options - Handler options
 */
export function handleMessage(
  ws: ServerWebSocket<ClientData>,
  data: string | ArrayBuffer,
  options: { log?: typeof console.log } = {}
): void {
  const log = options.log ?? console.log;
  const clientId = ws.data.id;

  // Convert ArrayBuffer to string if needed
  const messageStr = typeof data === 'string' ? data : new TextDecoder().decode(data);

  // Parse and validate the command
  const result: ValidationResult = parseAndValidateCommand(messageStr);

  if (!result.success) {
    log(`[WS] Invalid message from ${clientId}: ${result.error}`);

    // Map validation error code to WebSocket error code
    const wsErrorCode = result.code === 'INVALID_JSON' ? 'INVALID_MESSAGE' : 'INVALID_MESSAGE';

    const errorEvent = createErrorEvent(wsErrorCode, result.error);
    ws.send(JSON.stringify(errorEvent));
    return;
  }

  const { command } = result;
  const context: HandlerContext = { ws, log };

  // Route to appropriate handler
  switch (command.type) {
    case 'subscribe':
      handleSubscribe(command, context);
      break;

    case 'unsubscribe':
      handleUnsubscribe(command, context);
      break;

    case 'ping':
      handlePing(command, context);
      break;

    case 'authenticate':
      handleAuthenticate(command, context);
      break;

    default: {
      // This should never happen due to validation, but TypeScript doesn't know that
      const _exhaustiveCheck: never = command;
      log(`[WS] Unhandled command type: ${(_exhaustiveCheck as { type: string }).type}`);
    }
  }
}

// ============================================================================
// Connection Lifecycle Handlers
// ============================================================================

/**
 * Handle new WebSocket connection
 */
export function handleOpen(
  ws: ServerWebSocket<ClientData>,
  options: { log?: typeof console.log; serverVersion?: string } = {}
): void {
  const log = options.log ?? console.log;
  const serverVersion = options.serverVersion ?? '1.0.0';
  const { id } = ws.data;

  log(`[WS] Client connected: ${id}`);

  // Send connection acknowledgment
  const event = createConnectionAckEvent(id, serverVersion);
  ws.send(JSON.stringify(event));
}

/**
 * Handle WebSocket connection close
 */
export function handleClose(
  ws: ServerWebSocket<ClientData>,
  code: number,
  reason: string,
  options: { log?: typeof console.log; onCleanup?: (clientId: string) => void } = {}
): void {
  const log = options.log ?? console.log;
  const { id } = ws.data;

  log(`[WS] Client disconnected: ${id} (code: ${code}, reason: ${reason || 'none'})`);

  // Clean up subscriptions
  ws.data.subscribedChannels.clear();

  // Call cleanup callback if provided
  options.onCleanup?.(id);
}

/**
 * Handle WebSocket error
 */
export function handleError(
  ws: ServerWebSocket<ClientData>,
  error: Error,
  options: { log?: typeof console.log } = {}
): void {
  const log = options.log ?? console.error;
  const { id } = ws.data;

  log(`[WS] Error for client ${id}:`, error);

  // Try to send error event before close
  try {
    const event = createErrorEvent('INTERNAL_ERROR', 'An internal error occurred');
    ws.send(JSON.stringify(event));
  } catch {
    // Ignore errors when trying to send error event
  }
}
