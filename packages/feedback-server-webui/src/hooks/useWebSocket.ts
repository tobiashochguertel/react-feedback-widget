/**
 * useWebSocket Hook
 *
 * Main React hook for WebSocket communication.
 * Manages connection lifecycle and integrates with Zustand store.
 *
 * TASK-WWS-006: Create useWebSocket Hook
 *
 * @example
 * ```typescript
 * import { useWebSocket } from '@/hooks/useWebSocket';
 *
 * function MyComponent() {
 *   const {
 *     status,
 *     connectionId,
 *     connect,
 *     disconnect,
 *     subscribe,
 *     unsubscribe,
 *   } = useWebSocket({
 *     url: 'wss://api.example.com/ws',
 *     autoConnect: true,
 *   });
 *
 *   return (
 *     <div>
 *       <p>Status: {status}</p>
 *       <p>Connection ID: {connectionId}</p>
 *       <button onClick={() => subscribe('feedback')}>Subscribe</button>
 *     </div>
 *   );
 * }
 * ```
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useUIStore } from '@/stores/ui';
import {
  WebSocketClient,
  type UseWebSocketOptions,
  type UseWebSocketReturn,
  type ConnectionStatus,
  type SendResult,
  type SubscriptionFilters,
  type ServerEvent,
  type TypedEventHandler,
} from '@/lib/websocket';

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * React hook for WebSocket communication
 */
export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const { url, autoConnect = true, autoReconnect = true, ...restOptions } = options;

  // Store actions
  const setWsStatus = useUIStore((state) => state.setWsStatus);
  const setWsConnected = useUIStore((state) => state.setWsConnected);
  const incrementWsReconnectAttempts = useUIStore((state) => state.incrementWsReconnectAttempts);
  const resetWsReconnectAttempts = useUIStore((state) => state.resetWsReconnectAttempts);

  // Store selectors
  const wsStatus = useUIStore((state) => state.wsStatus);

  // Client reference
  const clientRef = useRef<WebSocketClient | null>(null);

  // Connection ID state (local, updated from client)
  const connectionIdRef = useRef<string | null>(null);
  const lastErrorRef = useRef<string | null>(null);

  // ============================================================================
  // Client Initialization
  // ============================================================================

  useEffect(() => {
    // Create client if not exists
    if (!clientRef.current) {
      clientRef.current = new WebSocketClient({
        url,
        autoConnect: false, // We'll control connection manually
        autoReconnect,
        ...restOptions,
      });

      // Set up status change handler
      clientRef.current.onStatusChange((newStatus, _previousStatus) => {
        setWsStatus(newStatus as ConnectionStatus);

        if (newStatus === 'connected') {
          setWsConnected();
          resetWsReconnectAttempts();
          connectionIdRef.current = clientRef.current?.getConnectionId() ?? null;
        }

        if (newStatus === 'reconnecting') {
          incrementWsReconnectAttempts();
        }

        if (newStatus === 'disconnected') {
          connectionIdRef.current = null;
        }
      });

      // Set up error handler
      clientRef.current.onError((error) => {
        lastErrorRef.current = error.message;
      });

      // Connect if autoConnect is true
      if (autoConnect) {
        clientRef.current.connect();
      }
    }

    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        clientRef.current.dispose();
        clientRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]); // Only recreate if URL changes

  // ============================================================================
  // Connection Methods
  // ============================================================================

  const connect = useCallback(() => {
    clientRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
  }, []);

  // ============================================================================
  // Command Methods
  // ============================================================================

  const sendCommand = useCallback(<T extends import('@feedback/api-types/websocket').ClientCommand>(
    command: T,
  ): SendResult => {
    if (!clientRef.current) {
      return { ok: false, error: 'Client not initialized' };
    }
    return clientRef.current.sendCommand(command);
  }, []);

  const subscribe = useCallback((channel: string, filters?: SubscriptionFilters) => {
    clientRef.current?.subscribe(channel, filters);
  }, []);

  const unsubscribe = useCallback((channel: string) => {
    clientRef.current?.unsubscribe(channel);
  }, []);

  const ping = useCallback(() => {
    clientRef.current?.ping();
  }, []);

  // ============================================================================
  // Return Value
  // ============================================================================

  return useMemo<UseWebSocketReturn>(
    () => ({
      status: wsStatus,
      connectionId: connectionIdRef.current,
      lastError: lastErrorRef.current,
      connect,
      disconnect,
      sendCommand,
      subscribe,
      unsubscribe,
      ping,
    }),
    [wsStatus, connect, disconnect, sendCommand, subscribe, unsubscribe, ping],
  );
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Hook to register event handlers on the WebSocket client
 * Note: This is a placeholder - in production, use WebSocketContext
 */
export function useWebSocketEvent<T extends ServerEvent['type']>(
  _eventType: T,
  _handler: TypedEventHandler<T>,
  deps: React.DependencyList = [],
): void {
  useEffect(() => {
    // This hook needs access to the client
    // In a real implementation, this would use context or a global singleton
    // For now, this is a placeholder that shows the pattern

    // Clean up on unmount or deps change
    return () => {
      // Cleanup would go here
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps]);
}

// ============================================================================
// Context (Optional - for sharing client across components)
// ============================================================================

// If needed, a WebSocketContext can be created to share the client instance
// across the component tree. For now, each useWebSocket call creates its own
// client, which is suitable for simple use cases.

/**
 * Get WebSocket URL from environment or configuration
 */
export function getWebSocketUrl(): string {
  // Check for Vite environment variable
  const viteEnv = typeof import.meta !== 'undefined' ? (import.meta as { env?: Record<string, string> }).env : undefined;
  if (viteEnv?.VITE_WS_URL) {
    return viteEnv.VITE_WS_URL;
  }

  // Check for window location-based URL
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  }

  // Default fallback
  return 'ws://localhost:3000/ws';
}
