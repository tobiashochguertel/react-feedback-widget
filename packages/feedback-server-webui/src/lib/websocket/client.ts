/**
 * WebSocket Client
 *
 * Type-safe WebSocket client for the feedback system.
 * Uses API-first types from @feedback/api-types for commands and events.
 *
 * TASK-WWS-003: Create WebSocket client class
 *
 * @example
 * ```typescript
 * import { WebSocketClient } from './client';
 *
 * const client = new WebSocketClient({
 *   url: 'wss://api.example.com/ws',
 *   autoConnect: true,
 * });
 *
 * client.on('feedback.created', (event) => {
 *   console.log('New feedback:', event.feedback);
 * });
 *
 * client.subscribe('feedback');
 * ```
 */

import {
  createSubscribeCommand,
  createUnsubscribeCommand,
  createPingCommand,
  createAuthenticateCommand,
  parseServerEvent,
  isConnectionAckEvent,
  isSubscriptionConfirmedEvent,
  isErrorEvent,
} from '@feedback/api-types/websocket';
import type { ClientCommand, ServerEvent, SubscriptionFilters } from '@feedback/api-types/websocket';
import type {
  ConnectionStatus,
  WebSocketClientConfig,
  EventHandler,
  TypedEventHandler,
  EventHandlerMap,
  ErrorHandler,
  StatusChangeHandler,
  ParsedMessage,
  SendResult,
} from './types';
import { DEFAULT_WS_CONFIG, WS_CLOSE_CODES } from './types';
import { ReconnectionManager } from './reconnect';
import { SubscriptionTracker } from './subscriptions';

// ============================================================================
// WebSocket Client Class
// ============================================================================

/**
 * Type-safe WebSocket client for the feedback system
 */
export class WebSocketClient {
  private socket: WebSocket | null = null;
  private config: Required<Omit<WebSocketClientConfig, 'authToken'>> & { authToken?: string };
  private status: ConnectionStatus = 'disconnected';
  private connectionId: string | null = null;
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;
  private connectionTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Event handling
  private eventHandlers: EventHandlerMap = {};
  private allEventHandlers: EventHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private statusChangeHandlers: StatusChangeHandler[] = [];

  // Managers
  private reconnectManager: ReconnectionManager;
  private subscriptionTracker: SubscriptionTracker;

  constructor(config: WebSocketClientConfig) {
    this.config = {
      ...DEFAULT_WS_CONFIG,
      ...config,
    };

    this.reconnectManager = new ReconnectionManager({
      maxAttempts: this.config.maxReconnectAttempts,
      baseDelay: this.config.reconnectBaseDelay,
      maxDelay: this.config.reconnectMaxDelay,
      onReconnect: () => this.connect(),
    });

    this.subscriptionTracker = new SubscriptionTracker();

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  // ============================================================================
  // Connection Methods
  // ============================================================================

  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (this.socket && (this.status === 'connected' || this.status === 'connecting')) {
      this.log('Already connected or connecting');
      return;
    }

    this.setStatus('connecting');

    try {
      this.socket = new WebSocket(this.config.url);
      this.setupSocketHandlers();
      this.startConnectionTimeout();
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)));
      this.setStatus('disconnected');
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.reconnectManager.stop();
    this.stopPingInterval();
    this.clearConnectionTimeout();

    if (this.socket) {
      this.socket.close(WS_CLOSE_CODES.NORMAL, 'Client initiated disconnect');
      this.socket = null;
    }

    this.connectionId = null;
    this.setStatus('disconnected');
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Get connection ID assigned by server
   */
  getConnectionId(): string | null {
    return this.connectionId;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === 'connected' && this.socket?.readyState === WebSocket.OPEN;
  }

  // ============================================================================
  // Command Methods
  // ============================================================================

  /**
   * Send a command to the server
   */
  sendCommand<T extends ClientCommand>(command: T): SendResult {
    if (!this.isConnected()) {
      return { ok: false, error: 'Not connected' };
    }

    try {
      const message = JSON.stringify(command);
      this.socket!.send(message);
      this.log('Sent command:', command.type);
      return { ok: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { ok: false, error: errorMessage };
    }
  }

  /**
   * Subscribe to a channel
   */
  subscribe(channel: string, filters?: SubscriptionFilters): SendResult {
    // Track subscription for resubscription on reconnect
    this.subscriptionTracker.add(channel, filters);

    const command = createSubscribeCommand(channel, filters);
    return this.sendCommand(command);
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string): SendResult {
    this.subscriptionTracker.remove(channel);

    const command = createUnsubscribeCommand(channel);
    return this.sendCommand(command);
  }

  /**
   * Send ping to keep connection alive
   */
  ping(): SendResult {
    const command = createPingCommand();
    return this.sendCommand(command);
  }

  /**
   * Authenticate the connection
   */
  authenticate(token: string): SendResult {
    const command = createAuthenticateCommand(token);
    return this.sendCommand(command);
  }

  // ============================================================================
  // Event Handler Methods
  // ============================================================================

  /**
   * Register a handler for a specific event type
   */
  on<T extends ServerEvent['type']>(eventType: T, handler: TypedEventHandler<T>): () => void {
    if (!this.eventHandlers[eventType]) {
      this.eventHandlers[eventType] = [];
    }

    // Type assertion needed due to TypeScript limitation with mapped types
    (this.eventHandlers[eventType] as TypedEventHandler<T>[]).push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers[eventType] as TypedEventHandler<T>[];
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    };
  }

  /**
   * Register a handler for all events
   */
  onAny(handler: EventHandler): () => void {
    this.allEventHandlers.push(handler);

    return () => {
      const index = this.allEventHandlers.indexOf(handler);
      if (index !== -1) {
        this.allEventHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Register an error handler
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.push(handler);

    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index !== -1) {
        this.errorHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Register a status change handler
   */
  onStatusChange(handler: StatusChangeHandler): () => void {
    this.statusChangeHandlers.push(handler);

    return () => {
      const index = this.statusChangeHandlers.indexOf(handler);
      if (index !== -1) {
        this.statusChangeHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Remove all handlers for an event type
   */
  off<T extends ServerEvent['type']>(eventType: T): void {
    delete this.eventHandlers[eventType];
  }

  /**
   * Remove all handlers
   */
  offAll(): void {
    this.eventHandlers = {};
    this.allEventHandlers = [];
    this.errorHandlers = [];
    this.statusChangeHandlers = [];
  }

  // ============================================================================
  // Subscription Management
  // ============================================================================

  /**
   * Get all active subscriptions
   */
  getSubscriptions(): { channel: string; filters?: SubscriptionFilters | undefined; confirmed: boolean }[] {
    return this.subscriptionTracker.getAll();
  }

  /**
   * Check if subscribed to a channel
   */
  isSubscribed(channel: string): boolean {
    return this.subscriptionTracker.has(channel);
  }

  // ============================================================================
  // Private Methods - Socket Handlers
  // ============================================================================

  private setupSocketHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      this.log('WebSocket connected');
      this.clearConnectionTimeout();
      this.reconnectManager.reset();

      // Authentication
      if (this.config.autoAuthenticate && this.config.authToken) {
        this.authenticate(this.config.authToken);
      }

      // Start ping interval
      if (this.config.pingInterval > 0) {
        this.startPingInterval();
      }

      // Note: We don't set status to 'connected' here.
      // We wait for 'connection.ack' event from server.
    };

    this.socket.onclose = (event) => {
      this.log('WebSocket closed:', event.code, event.reason);
      this.stopPingInterval();
      this.socket = null;

      // Handle reconnection
      if (this.config.autoReconnect && event.code !== WS_CLOSE_CODES.NORMAL) {
        this.setStatus('reconnecting');
        this.reconnectManager.scheduleReconnect();
      } else {
        this.setStatus('disconnected');
        this.connectionId = null;
      }
    };

    this.socket.onerror = (event) => {
      this.log('WebSocket error:', event);
      this.handleError(new Error('WebSocket error'));
    };

    this.socket.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }

  private handleMessage(data: string): void {
    const parsed = this.parseMessage(data);

    if (!parsed.ok) {
      this.log('Failed to parse message:', parsed.error);
      return;
    }

    const event = parsed.event;
    this.log('Received event:', event.type);

    // Handle special events
    if (isConnectionAckEvent(event)) {
      this.connectionId = event.connectionId;
      this.setStatus('connected');

      // Resubscribe to all channels
      this.resubscribeAll();
    }

    if (isSubscriptionConfirmedEvent(event)) {
      this.subscriptionTracker.confirm(event.channel);
    }

    if (isErrorEvent(event)) {
      this.handleError(new Error(event.message));
    }

    // Dispatch to typed handlers
    const handlers = this.eventHandlers[event.type];
    if (handlers) {
      for (const handler of handlers) {
        try {
          // Type assertion needed here
          (handler as EventHandler)(event);
        } catch (error) {
          this.log('Error in event handler:', error);
        }
      }
    }

    // Dispatch to all-event handlers
    for (const handler of this.allEventHandlers) {
      try {
        handler(event);
      } catch (error) {
        this.log('Error in all-event handler:', error);
      }
    }
  }

  private parseMessage(data: string): ParsedMessage {
    try {
      const json = JSON.parse(data);
      const result = parseServerEvent(json);

      if (result.ok) {
        return { ok: true, event: result.event };
      }

      return { ok: false, error: result.error, rawData: data };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Parse error',
        rawData: data,
      };
    }
  }

  private resubscribeAll(): void {
    const subscriptions = this.subscriptionTracker.getAll();

    for (const sub of subscriptions) {
      // Mark as unconfirmed for resubscription
      this.subscriptionTracker.unconfirm(sub.channel);

      // Send subscribe command
      const command = createSubscribeCommand(sub.channel, sub.filters);
      this.sendCommand(command);
    }

    this.log(`Resubscribed to ${subscriptions.length} channels`);
  }

  // ============================================================================
  // Private Methods - Status Management
  // ============================================================================

  private setStatus(newStatus: ConnectionStatus): void {
    if (this.status === newStatus) return;

    const previousStatus = this.status;
    this.status = newStatus;

    this.log(`Status changed: ${previousStatus} -> ${newStatus}`);

    for (const handler of this.statusChangeHandlers) {
      try {
        handler(newStatus, previousStatus);
      } catch (error) {
        this.log('Error in status change handler:', error);
      }
    }
  }

  // ============================================================================
  // Private Methods - Timers
  // ============================================================================

  private startPingInterval(): void {
    this.stopPingInterval();

    this.pingIntervalId = setInterval(() => {
      if (this.isConnected()) {
        this.ping();
      }
    }, this.config.pingInterval);
  }

  private stopPingInterval(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }

  private startConnectionTimeout(): void {
    this.clearConnectionTimeout();

    this.connectionTimeoutId = setTimeout(() => {
      if (this.status === 'connecting') {
        this.handleError(new Error('Connection timeout'));
        this.socket?.close(WS_CLOSE_CODES.POLICY_VIOLATION, 'Connection timeout');
      }
    }, this.config.connectionTimeout);
  }

  private clearConnectionTimeout(): void {
    if (this.connectionTimeoutId) {
      clearTimeout(this.connectionTimeoutId);
      this.connectionTimeoutId = null;
    }
  }

  // ============================================================================
  // Private Methods - Error Handling
  // ============================================================================

  private handleError(error: Error): void {
    this.log('Error:', error.message);

    for (const handler of this.errorHandlers) {
      try {
        handler(error);
      } catch (e) {
        this.log('Error in error handler:', e);
      }
    }
  }

  // ============================================================================
  // Private Methods - Logging
  // ============================================================================

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[WebSocketClient]', ...args);
    }
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Dispose of the client and clean up resources
   */
  dispose(): void {
    this.disconnect();
    this.offAll();
    this.subscriptionTracker.clear();
  }
}
