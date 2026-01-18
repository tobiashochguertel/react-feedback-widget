/**
 * WebSocket Types Integration
 *
 * This module bridges the generated @feedback/api-types WebSocket types
 * with the server's internal types, ensuring type safety across the boundary.
 *
 * @module websocket/types
 */

// Re-export all generated WebSocket types
export {
  // Server Events
  type ServerEvent,
  type ServerEventMap,
  type ServerEventType,
  type FeedbackCreatedEvent,
  type FeedbackUpdatedEvent,
  type FeedbackDeletedEvent,
  type FeedbackBulkUpdateEvent,
  type ConnectionAckEvent,
  type SubscriptionConfirmedEvent,
  type ErrorEvent,
  type PongEvent,
  type BulkUpdateAction,
  type WebSocketErrorCode,

  // Type guards
  isFeedbackCreatedEvent,
  isFeedbackUpdatedEvent,
  isFeedbackDeletedEvent,
  isFeedbackBulkUpdateEvent,
  isConnectionAckEvent,
  isSubscriptionConfirmedEvent,
  isErrorEvent,
  isPongEvent,
  isFeedbackEvent,

  // Client Commands
  type ClientCommand,
  type ClientCommandMap,
  type ClientCommandType,
  type SubscribeCommand,
  type UnsubscribeCommand,
  type PingCommand,
  type AuthenticateCommand,
  type SubscriptionFilters,

  // Command type guards
  isSubscribeCommand,
  isUnsubscribeCommand,
  isPingCommand,
  isAuthenticateCommand,

  // Command factory functions
  createSubscribeCommand,
  createUnsubscribeCommand,
  createPingCommand,
  createAuthenticateCommand,
} from '@feedback/api-types';

// Import for internal use
import type {
  ServerEvent,
  FeedbackCreatedEvent,
  FeedbackUpdatedEvent,
  FeedbackDeletedEvent,
  FeedbackBulkUpdateEvent,
  ConnectionAckEvent,
  SubscriptionConfirmedEvent,
  ErrorEvent,
  PongEvent,
  BulkUpdateAction,
  WebSocketErrorCode,
  ClientCommand,
} from '@feedback/api-types';

import type { Feedback } from '../db/schema';

// ============================================================================
// Extended Server Types (for backward compatibility and sync)
// ============================================================================

/**
 * Extended server message types including sync protocol messages
 *
 * These types extend the standard WebSocket events with server-specific
 * sync protocol messages that are not part of the public API spec.
 */
export type ExtendedServerMessage =
  | ServerEvent
  // Legacy message types (being phased out)
  | { type: 'subscribed'; projectId: string }
  | { type: 'unsubscribed'; projectId: string }
  | { type: 'welcome'; clientId: string; timestamp: string }
  // Sync protocol messages
  | { type: 'sync:changes'; changes: unknown[]; timestamp: string }
  | { type: 'sync:complete'; timestamp: string; count: number }
  // Backward compatibility for status change
  | { type: 'feedback:status'; feedbackId: string; oldStatus: string; newStatus: string };

/**
 * Extended client message types including sync protocol messages
 */
export type ExtendedClientMessage =
  | ClientCommand
  // Legacy message types (being phased out)
  | { type: 'subscribe'; projectId: string; sessionId?: string }
  | { type: 'unsubscribe'; projectId: string }
  | { type: 'auth'; token: string }
  // Sync protocol messages
  | { type: 'sync:request'; lastSyncTimestamp?: string }
  | { type: 'sync:ack'; syncTimestamp: string };

// ============================================================================
// Event Factory Functions
// ============================================================================

/**
 * Create a FeedbackCreatedEvent from a Feedback entity
 */
export function createFeedbackCreatedEvent(feedback: Feedback): FeedbackCreatedEvent {
  return {
    type: 'feedback.created',
    timestamp: new Date().toISOString(),
    feedback: feedback as FeedbackCreatedEvent['feedback'],
  };
}

/**
 * Create a FeedbackUpdatedEvent from a Feedback entity
 */
export function createFeedbackUpdatedEvent(
  feedback: Feedback,
  changedFields: string[]
): FeedbackUpdatedEvent {
  return {
    type: 'feedback.updated',
    timestamp: new Date().toISOString(),
    feedback: feedback as FeedbackUpdatedEvent['feedback'],
    changedFields,
  };
}

/**
 * Create a FeedbackDeletedEvent
 */
export function createFeedbackDeletedEvent(feedbackId: string): FeedbackDeletedEvent {
  return {
    type: 'feedback.deleted',
    timestamp: new Date().toISOString(),
    feedbackId,
  };
}

/**
 * Create a FeedbackBulkUpdateEvent
 */
export function createFeedbackBulkUpdateEvent(
  feedbackIds: string[],
  action: BulkUpdateAction
): FeedbackBulkUpdateEvent {
  return {
    type: 'feedback.bulk_update',
    timestamp: new Date().toISOString(),
    feedbackIds,
    action,
  };
}

/**
 * Create a ConnectionAckEvent
 */
export function createConnectionAckEvent(
  connectionId: string,
  serverVersion: string
): ConnectionAckEvent {
  return {
    type: 'connection.ack',
    timestamp: new Date().toISOString(),
    connectionId,
    serverVersion,
  };
}

/**
 * Create a SubscriptionConfirmedEvent
 */
export function createSubscriptionConfirmedEvent(channel: string): SubscriptionConfirmedEvent {
  return {
    type: 'subscription.confirmed',
    timestamp: new Date().toISOString(),
    channel,
  };
}

/**
 * Create an ErrorEvent
 */
export function createErrorEvent(
  code: WebSocketErrorCode,
  message: string,
  details?: Record<string, unknown>
): ErrorEvent {
  return {
    type: 'error',
    timestamp: new Date().toISOString(),
    code,
    message,
    ...(details && { details }),
  };
}

/**
 * Create a PongEvent
 */
export function createPongEvent(): PongEvent {
  return {
    type: 'pong',
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Type Mapping Helpers
// ============================================================================

/**
 * Map old event types to new event types
 */
export const EVENT_TYPE_MAP = {
  // Old -> New
  'feedback:created': 'feedback.created',
  'feedback:updated': 'feedback.updated',
  'feedback:deleted': 'feedback.deleted',
  welcome: 'connection.ack',
  subscribed: 'subscription.confirmed',
  error: 'error',
  pong: 'pong',
} as const;

/**
 * Map old command types to new command types
 */
export const COMMAND_TYPE_MAP = {
  // Old -> New
  subscribe: 'subscribe',
  unsubscribe: 'unsubscribe',
  ping: 'ping',
  auth: 'authenticate',
} as const;

/**
 * Check if a message is using the new API format (uses dot notation)
 */
export function isNewApiFormat(message: { type: string }): boolean {
  return message.type.includes('.');
}

/**
 * Check if a message is using the legacy format (uses colon notation)
 */
export function isLegacyFormat(message: { type: string }): boolean {
  return message.type.includes(':') || ['ping', 'pong', 'error', 'subscribe', 'unsubscribe', 'auth'].includes(message.type);
}
