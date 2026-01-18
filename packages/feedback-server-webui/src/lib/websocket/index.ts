/**
 * WebSocket Library
 *
 * Type-safe WebSocket client library for the feedback system.
 * Uses API-first types from @feedback/api-types.
 *
 * @module lib/websocket
 *
 * @example
 * ```typescript
 * import { WebSocketClient } from '@/lib/websocket';
 *
 * const client = new WebSocketClient({
 *   url: 'wss://api.example.com/ws',
 *   autoConnect: true,
 *   debug: true,
 * });
 *
 * client.on('feedback.created', (event) => {
 *   console.log('New feedback:', event.feedback);
 * });
 *
 * client.subscribe('feedback', { status: ['new', 'in_progress'] });
 * ```
 */

// ============================================================================
// Client
// ============================================================================

export { WebSocketClient } from './client';

// ============================================================================
// Managers
// ============================================================================

export {
  ReconnectionManager,
  calculateReconnectDelay,
  formatDelay,
  type ReconnectionManagerConfig,
  type ReconnectionState,
} from './reconnect';

export {
  SubscriptionTracker,
  createFeedbackChannel,
  parseFeedbackChannel,
  isFeedbackChannel,
} from './subscriptions';

// ============================================================================
// Types
// ============================================================================

export type {
  // Connection types
  ConnectionStatus,
  WsCloseCode,

  // Configuration types
  WebSocketClientConfig,

  // Event handler types
  EventHandler,
  TypedEventHandler,
  EventHandlerMap,
  ErrorHandler,
  StatusChangeHandler,

  // Subscription types
  Subscription,
  SubscriptionRegistry,

  // Message types
  ParsedMessage,
  SendResult,

  // Hook types
  UseWebSocketOptions,
  UseWebSocketReturn,
  UseFeedbackSubscriptionOptions,
  UseFeedbackSubscriptionReturn,
} from './types';

export { DEFAULT_WS_CONFIG, WS_CLOSE_CODES } from './types';

// ============================================================================
// Re-exported API Types (for convenience)
// ============================================================================

export type {
  // Event types
  ServerEvent,
  FeedbackCreatedEvent,
  FeedbackUpdatedEvent,
  FeedbackDeletedEvent,
  FeedbackBulkUpdateEvent,
  ConnectionAckEvent,
  SubscriptionConfirmedEvent,
  ErrorEvent,
  PongEvent,

  // Command types
  ClientCommand,
  SubscribeCommand,
  UnsubscribeCommand,
  PingCommand,
  AuthenticateCommand,
  SubscriptionFilters,
} from './types';
