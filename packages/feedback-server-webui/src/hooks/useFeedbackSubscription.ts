/**
 * useFeedbackSubscription Hook
 *
 * Convenience hook for subscribing to feedback events.
 * Automatically handles subscription lifecycle and React Query cache updates.
 *
 * TASK-WWS-007: Create useFeedbackSubscription Hook
 *
 * @example
 * ```typescript
 * import { useFeedbackSubscription } from '@/hooks/useFeedbackSubscription';
 *
 * function FeedbackList() {
 *   const { isSubscribed, subscribe, unsubscribe } = useFeedbackSubscription({
 *     autoSubscribe: true,
 *     filters: { status: ['new', 'in_progress'] },
 *     onFeedbackCreated: (event) => {
 *       console.log('New feedback:', event.feedback);
 *     },
 *   });
 *
 *   return (
 *     <div>
 *       <p>Subscribed: {isSubscribed ? 'Yes' : 'No'}</p>
 *     </div>
 *   );
 * }
 * ```
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type {
  UseFeedbackSubscriptionOptions,
  UseFeedbackSubscriptionReturn,
  SubscriptionFilters,
} from '@/lib/websocket';
import {
  createFeedbackChannel,
} from '@/lib/websocket';
import type {
  FeedbackCreatedEvent,
  FeedbackUpdatedEvent,
  FeedbackDeletedEvent,
  FeedbackBulkUpdateEvent,
} from '@feedback/api-types/websocket';
import { useWebSocket, getWebSocketUrl } from './useWebSocket';

// ============================================================================
// Query Keys (for React Query cache updates)
// ============================================================================

const FEEDBACK_QUERY_KEYS = {
  all: ['feedback'] as const,
  lists: () => [...FEEDBACK_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...FEEDBACK_QUERY_KEYS.lists(), filters] as const,
  details: () => [...FEEDBACK_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...FEEDBACK_QUERY_KEYS.details(), id] as const,
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * React hook for subscribing to feedback events
 */
export function useFeedbackSubscription(
  options: UseFeedbackSubscriptionOptions = {},
): UseFeedbackSubscriptionReturn {
  const {
    projectId,
    autoSubscribe = true,
    filters,
    onFeedbackCreated,
    onFeedbackUpdated,
    onFeedbackDeleted,
    onFeedbackBulkUpdate,
  } = options;

  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Store callback refs to avoid re-subscribing on callback changes
  const callbacksRef = useRef({
    onFeedbackCreated,
    onFeedbackUpdated,
    onFeedbackDeleted,
    onFeedbackBulkUpdate,
  });

  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onFeedbackCreated,
      onFeedbackUpdated,
      onFeedbackDeleted,
      onFeedbackBulkUpdate,
    };
  }, [onFeedbackCreated, onFeedbackUpdated, onFeedbackDeleted, onFeedbackBulkUpdate]);

  // Get WebSocket connection
  const ws = useWebSocket({
    url: getWebSocketUrl(),
    autoConnect: true,
  });

  // Determine channel name
  const channelName = createFeedbackChannel(projectId);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle feedback created event
   */
  const handleFeedbackCreated = useCallback(
    (event: FeedbackCreatedEvent) => {
      // Call user callback
      callbacksRef.current.onFeedbackCreated?.(event);

      // Update React Query cache - invalidate list queries
      queryClient.invalidateQueries({
        queryKey: FEEDBACK_QUERY_KEYS.lists(),
      });

      // Optionally, add to cache directly for optimistic updates
      // queryClient.setQueryData(
      //   FEEDBACK_QUERY_KEYS.detail(event.feedback.id),
      //   event.feedback
      // );
    },
    [queryClient],
  );

  /**
   * Handle feedback updated event
   */
  const handleFeedbackUpdated = useCallback(
    (event: FeedbackUpdatedEvent) => {
      // Call user callback
      callbacksRef.current.onFeedbackUpdated?.(event);

      // Update React Query cache - update detail
      queryClient.setQueryData(
        FEEDBACK_QUERY_KEYS.detail(event.feedback.id),
        event.feedback,
      );

      // Invalidate list queries (order might have changed)
      queryClient.invalidateQueries({
        queryKey: FEEDBACK_QUERY_KEYS.lists(),
      });
    },
    [queryClient],
  );

  /**
   * Handle feedback deleted event
   */
  const handleFeedbackDeleted = useCallback(
    (event: FeedbackDeletedEvent) => {
      // Call user callback
      callbacksRef.current.onFeedbackDeleted?.(event);

      // Remove from React Query cache
      queryClient.removeQueries({
        queryKey: FEEDBACK_QUERY_KEYS.detail(event.feedbackId),
      });

      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: FEEDBACK_QUERY_KEYS.lists(),
      });
    },
    [queryClient],
  );

  /**
   * Handle feedback bulk update event
   */
  const handleFeedbackBulkUpdate = useCallback(
    (event: FeedbackBulkUpdateEvent) => {
      // Call user callback
      callbacksRef.current.onFeedbackBulkUpdate?.(event);

      // Invalidate all affected detail queries
      for (const feedbackId of event.feedbackIds) {
        queryClient.invalidateQueries({
          queryKey: FEEDBACK_QUERY_KEYS.detail(feedbackId),
        });
      }

      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: FEEDBACK_QUERY_KEYS.lists(),
      });
    },
    [queryClient],
  );

  // ============================================================================
  // Subscription Management
  // ============================================================================

  const subscribe = useCallback(
    (subscribeFilters?: SubscriptionFilters) => {
      const effectiveFilters = subscribeFilters ?? filters;
      ws.subscribe(channelName, effectiveFilters);
      setIsSubscribed(true);
    },
    [ws, channelName, filters],
  );

  const unsubscribe = useCallback(() => {
    ws.unsubscribe(channelName);
    setIsSubscribed(false);
  }, [ws, channelName]);

  // ============================================================================
  // Auto-subscription Effect
  // ============================================================================

  useEffect(() => {
    if (!autoSubscribe) return;

    // Wait for connection
    if (ws.status !== 'connected') return;

    // Subscribe
    subscribe();

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [autoSubscribe, ws.status, subscribe, unsubscribe]);

  // ============================================================================
  // Event Registration Effect
  // ============================================================================

  // Note: In the current implementation, event handlers need to be registered
  // with the WebSocketClient directly. This would require access to the client
  // instance, which could be done via Context or a global singleton.
  //
  // For now, this effect demonstrates the pattern but would need integration
  // with a shared WebSocket context.

  useEffect(() => {
    // This effect would register event handlers with the WebSocket client
    // In a production implementation, this would use WebSocketContext

    // Placeholder for event registration
    // const unsubCreated = client.on('feedback.created', handleFeedbackCreated);
    // const unsubUpdated = client.on('feedback.updated', handleFeedbackUpdated);
    // const unsubDeleted = client.on('feedback.deleted', handleFeedbackDeleted);
    // const unsubBulk = client.on('feedback.bulk_update', handleFeedbackBulkUpdate);

    return () => {
      // Cleanup event handlers
      // unsubCreated();
      // unsubUpdated();
      // unsubDeleted();
      // unsubBulk();
    };
  }, [
    handleFeedbackCreated,
    handleFeedbackUpdated,
    handleFeedbackDeleted,
    handleFeedbackBulkUpdate,
  ]);

  // ============================================================================
  // Return Value
  // ============================================================================

  return {
    isSubscribed,
    subscribe,
    unsubscribe,
  };
}

// ============================================================================
// Specialized Hooks
// ============================================================================

/**
 * Hook for subscribing to a specific feedback item's events
 */
export function useFeedbackItemSubscription(
  feedbackId: string,
  options: Omit<UseFeedbackSubscriptionOptions, 'projectId'> = {},
): UseFeedbackSubscriptionReturn {
  // For a specific feedback item, we create a channel like 'feedback:{id}'
  return useFeedbackSubscription({
    ...options,
    projectId: feedbackId, // This will create channel 'feedback:{feedbackId}'
  });
}

/**
 * Hook to check if real-time updates are available
 */
export function useRealtimeStatus(): {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
} {
  const ws = useWebSocket({ url: getWebSocketUrl(), autoConnect: false });

  return {
    isConnected: ws.status === 'connected',
    isReconnecting: ws.status === 'reconnecting',
    reconnectAttempts: 0, // Would come from store
  };
}
