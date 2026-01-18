/**
 * WebSocket Library Types
 *
 * Internal types for the WebSocket client library that extend
 * or wrap the API-first types from @feedback/api-types.
 *
 * TASK-WWS-002: Directory structure and types
 */

import type {
  ClientCommand,
  ServerEvent,
  SubscriptionFilters,
} from '@feedback/api-types/websocket';

// Re-export API types for convenience
export type {
  ClientCommand,
  ServerEvent,
  SubscriptionFilters,
  // Event types
  FeedbackCreatedEvent,
  FeedbackUpdatedEvent,
  FeedbackDeletedEvent,
  FeedbackBulkUpdateEvent,
  ConnectionAckEvent,
  SubscriptionConfirmedEvent,
  ErrorEvent,
  PongEvent,
  // Command types
  SubscribeCommand,
  UnsubscribeCommand,
  PingCommand,
  AuthenticateCommand,
} from '@feedback/api-types/websocket';

// ============================================================================
// Connection Types
// ============================================================================

/**
 * WebSocket connection status
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/**
 * WebSocket close codes
 */
export const WS_CLOSE_CODES = {
  NORMAL: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  INVALID_DATA: 1003,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_LARGE: 1009,
  UNEXPECTED_CONDITION: 1011,
  // Custom application codes (4000-4999)
  AUTH_FAILED: 4001,
  RATE_LIMITED: 4029,
  SERVER_ERROR: 4500,
} as const;

export type WsCloseCode = (typeof WS_CLOSE_CODES)[keyof typeof WS_CLOSE_CODES];

// ============================================================================
// Client Configuration Types
// ============================================================================

/**
 * WebSocket client configuration options
 */
export interface WebSocketClientConfig {
  /** WebSocket server URL (ws:// or wss://) */
  url: string;
  /** Whether to automatically connect on creation */
  autoConnect?: boolean;
  /** Whether to automatically reconnect on disconnect */
  autoReconnect?: boolean;
  /** Whether to authenticate on connection (if token provided) */
  autoAuthenticate?: boolean;
  /** JWT token or API key for authentication */
  authToken?: string;
  /** Maximum reconnection attempts (0 = infinite) */
  maxReconnectAttempts?: number;
  /** Base delay between reconnection attempts (ms) */
  reconnectBaseDelay?: number;
  /** Maximum delay between reconnection attempts (ms) */
  reconnectMaxDelay?: number;
  /** Ping interval for keep-alive (ms, 0 = disabled) */
  pingInterval?: number;
  /** Connection timeout (ms) */
  connectionTimeout?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Default configuration values
 */
export const DEFAULT_WS_CONFIG: Required<Omit<WebSocketClientConfig, 'url' | 'authToken'>> = {
  autoConnect: true,
  autoReconnect: true,
  autoAuthenticate: true,
  maxReconnectAttempts: 10,
  reconnectBaseDelay: 1000,
  reconnectMaxDelay: 30000,
  pingInterval: 30000,
  connectionTimeout: 10000,
  debug: false,
};

// ============================================================================
// Event Handler Types
// ============================================================================

/**
 * Handler for all server events
 */
export type EventHandler<T extends ServerEvent = ServerEvent> = (event: T) => void;

/**
 * Handler for specific event type
 */
export type TypedEventHandler<T extends ServerEvent['type']> = (
  event: Extract<ServerEvent, { type: T }>,
) => void;

/**
 * Map of event type to handler function
 */
export type EventHandlerMap = {
  [K in ServerEvent['type']]?: TypedEventHandler<K>[];
};

/**
 * Error handler for WebSocket errors
 */
export type ErrorHandler = (error: Error) => void;

/**
 * Status change handler
 */
export type StatusChangeHandler = (status: ConnectionStatus, previousStatus: ConnectionStatus) => void;

// ============================================================================
// Subscription Types
// ============================================================================

/**
 * Subscription entry for tracking active subscriptions
 */
export interface Subscription {
  /** Unique subscription ID */
  id: string;
  /** Channel name (e.g., 'feedback', 'feedback:123') */
  channel: string;
  /** Optional filters applied to subscription */
  filters?: SubscriptionFilters | undefined;
  /** Whether subscription is confirmed by server */
  confirmed: boolean;
  /** Timestamp when subscription was created */
  createdAt: number;
}

/**
 * Subscription registry for tracking and restoring subscriptions
 */
export interface SubscriptionRegistry {
  /** Map of subscription ID to subscription */
  subscriptions: Map<string, Subscription>;
  /** Get all active subscriptions */
  getAll(): Subscription[];
  /** Get subscription by channel */
  getByChannel(channel: string): Subscription | undefined;
  /** Add a new subscription */
  add(channel: string, filters?: SubscriptionFilters): Subscription;
  /** Remove a subscription by ID or channel */
  remove(idOrChannel: string): boolean;
  /** Mark subscription as confirmed */
  confirm(channel: string): boolean;
  /** Clear all subscriptions */
  clear(): void;
}

// ============================================================================
// Message Types
// ============================================================================

/**
 * Parsed message from WebSocket
 */
export type ParsedMessage =
  | { ok: true; event: ServerEvent }
  | { ok: false; error: string; rawData: string };

/**
 * Command sending result
 */
export type SendResult =
  | { ok: true }
  | { ok: false; error: string };

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Options for useWebSocket hook
 */
export interface UseWebSocketOptions extends Partial<WebSocketClientConfig> {
  /** WebSocket server URL */
  url: string;
}

/**
 * Return type for useWebSocket hook
 */
export interface UseWebSocketReturn {
  /** Current connection status */
  status: ConnectionStatus;
  /** Connection ID assigned by server */
  connectionId: string | null;
  /** Last error message */
  lastError: string | null;
  /** Connect to WebSocket server */
  connect: () => void;
  /** Disconnect from WebSocket server */
  disconnect: () => void;
  /** Send a command to the server */
  sendCommand: <T extends ClientCommand>(command: T) => SendResult;
  /** Subscribe to a channel */
  subscribe: (channel: string, filters?: SubscriptionFilters) => void;
  /** Unsubscribe from a channel */
  unsubscribe: (channel: string) => void;
  /** Send ping to keep connection alive */
  ping: () => void;
}

/**
 * Options for useFeedbackSubscription hook
 */
export interface UseFeedbackSubscriptionOptions {
  /** Project ID to filter feedback (optional) */
  projectId?: string;
  /** Whether to auto-subscribe on mount */
  autoSubscribe?: boolean;
  /** Subscription filters */
  filters?: SubscriptionFilters;
  /** Callback when feedback is created */
  onFeedbackCreated?: (event: import('@feedback/api-types/websocket').FeedbackCreatedEvent) => void;
  /** Callback when feedback is updated */
  onFeedbackUpdated?: (event: import('@feedback/api-types/websocket').FeedbackUpdatedEvent) => void;
  /** Callback when feedback is deleted */
  onFeedbackDeleted?: (event: import('@feedback/api-types/websocket').FeedbackDeletedEvent) => void;
  /** Callback for bulk updates */
  onFeedbackBulkUpdate?: (event: import('@feedback/api-types/websocket').FeedbackBulkUpdateEvent) => void;
}

/**
 * Return type for useFeedbackSubscription hook
 */
export interface UseFeedbackSubscriptionReturn {
  /** Whether currently subscribed */
  isSubscribed: boolean;
  /** Subscribe to feedback events */
  subscribe: (filters?: SubscriptionFilters) => void;
  /** Unsubscribe from feedback events */
  unsubscribe: () => void;
}
