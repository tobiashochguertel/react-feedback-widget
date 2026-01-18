/**
 * WebSocket Event Broadcaster
 *
 * Sends typed ServerEvents to subscribed clients.
 *
 * @module websocket/broadcaster
 */

import type { ServerWebSocket } from 'bun';
import type {
  ServerEvent,
  FeedbackCreatedEvent,
  FeedbackUpdatedEvent,
  FeedbackDeletedEvent,
  FeedbackBulkUpdateEvent,
  BulkUpdateAction,
} from '@feedback/api-types';

import type { Feedback } from '../db/schema';
import type { ClientData } from './config';
import {
  createFeedbackCreatedEvent,
  createFeedbackUpdatedEvent,
  createFeedbackDeletedEvent,
  createFeedbackBulkUpdateEvent,
} from './types';

// ============================================================================
// Client Registry
// ============================================================================

/**
 * Map of connected clients by their ID
 */
const clients = new Map<string, ServerWebSocket<ClientData>>();

/**
 * Map of channel subscriptions (channel -> Set of client IDs)
 */
const channelSubscriptions = new Map<string, Set<string>>();

// ============================================================================
// Client Management
// ============================================================================

/**
 * Register a new client
 */
export function registerClient(ws: ServerWebSocket<ClientData>): void {
  clients.set(ws.data.id, ws);
}

/**
 * Unregister a client
 */
export function unregisterClient(clientId: string): void {
  // Remove from all channel subscriptions
  for (const [channel, subscribers] of channelSubscriptions) {
    subscribers.delete(clientId);
    if (subscribers.size === 0) {
      channelSubscriptions.delete(channel);
    }
  }

  // Remove from clients map
  clients.delete(clientId);
}

/**
 * Subscribe a client to a channel
 */
export function subscribeToChannel(clientId: string, channel: string): void {
  if (!channelSubscriptions.has(channel)) {
    channelSubscriptions.set(channel, new Set());
  }
  channelSubscriptions.get(channel)!.add(clientId);
}

/**
 * Unsubscribe a client from a channel
 */
export function unsubscribeFromChannel(clientId: string, channel: string): void {
  const subscribers = channelSubscriptions.get(channel);
  if (subscribers) {
    subscribers.delete(clientId);
    if (subscribers.size === 0) {
      channelSubscriptions.delete(channel);
    }
  }
}

/**
 * Get the number of connected clients
 */
export function getClientCount(): number {
  return clients.size;
}

/**
 * Get the number of clients subscribed to a channel
 */
export function getChannelSubscriberCount(channel: string): number {
  return channelSubscriptions.get(channel)?.size ?? 0;
}

// ============================================================================
// Send Functions
// ============================================================================

/**
 * Send a message to a specific client
 */
function sendToClient(clientId: string, event: ServerEvent): boolean {
  const client = clients.get(clientId);
  if (!client || client.readyState !== WebSocket.OPEN) {
    return false;
  }

  try {
    client.send(JSON.stringify(event));
    return true;
  } catch (error) {
    console.error(`[WS] Failed to send to client ${clientId}:`, error);
    return false;
  }
}

/**
 * Broadcast an event to a channel
 *
 * @param channel - The channel to broadcast to
 * @param event - The event to broadcast
 * @returns Number of clients the message was sent to
 */
export function broadcastToChannel(channel: string, event: ServerEvent): number {
  const subscribers = channelSubscriptions.get(channel);
  if (!subscribers || subscribers.size === 0) {
    return 0;
  }

  let sent = 0;
  for (const clientId of subscribers) {
    if (sendToClient(clientId, event)) {
      sent++;
    }
  }

  return sent;
}

/**
 * Broadcast an event to all connected clients
 *
 * @param event - The event to broadcast
 * @returns Number of clients the message was sent to
 */
export function broadcastToAll(event: ServerEvent): number {
  let sent = 0;
  for (const clientId of clients.keys()) {
    if (sendToClient(clientId, event)) {
      sent++;
    }
  }
  return sent;
}

/**
 * Broadcast an event to a specific project channel
 *
 * This is a convenience function that broadcasts to both:
 * - The general "feedback" channel
 * - The project-specific "feedback:project-{projectId}" channel
 *
 * @param projectId - The project ID
 * @param event - The event to broadcast
 * @returns Number of unique clients the message was sent to
 */
export function broadcastToProject(projectId: string, event: ServerEvent): number {
  const sentClients = new Set<string>();

  // Broadcast to general feedback channel
  const feedbackSubscribers = channelSubscriptions.get('feedback');
  if (feedbackSubscribers) {
    for (const clientId of feedbackSubscribers) {
      if (sendToClient(clientId, event)) {
        sentClients.add(clientId);
      }
    }
  }

  // Broadcast to project-specific channel
  const projectChannel = `feedback:project-${projectId}`;
  const projectSubscribers = channelSubscriptions.get(projectChannel);
  if (projectSubscribers) {
    for (const clientId of projectSubscribers) {
      // Avoid sending duplicate to clients subscribed to both channels
      if (!sentClients.has(clientId) && sendToClient(clientId, event)) {
        sentClients.add(clientId);
      }
    }
  }

  return sentClients.size;
}

// ============================================================================
// Typed Broadcast Functions
// ============================================================================

/**
 * Broadcast a FeedbackCreatedEvent
 *
 * @param feedback - The created feedback item
 * @returns Number of clients notified
 */
export function broadcastFeedbackCreated(feedback: Feedback): number {
  const event = createFeedbackCreatedEvent(feedback);
  return broadcastToProject(feedback.projectId ?? 'default', event);
}

/**
 * Broadcast a FeedbackUpdatedEvent
 *
 * @param feedback - The updated feedback item
 * @param changedFields - List of fields that were changed
 * @returns Number of clients notified
 */
export function broadcastFeedbackUpdated(feedback: Feedback, changedFields: string[]): number {
  const event = createFeedbackUpdatedEvent(feedback, changedFields);
  return broadcastToProject(feedback.projectId ?? 'default', event);
}

/**
 * Broadcast a FeedbackDeletedEvent
 *
 * @param feedbackId - ID of the deleted feedback
 * @param projectId - Project ID the feedback belonged to
 * @returns Number of clients notified
 */
export function broadcastFeedbackDeleted(feedbackId: string, projectId: string): number {
  const event = createFeedbackDeletedEvent(feedbackId);
  return broadcastToProject(projectId, event);
}

/**
 * Broadcast a FeedbackBulkUpdateEvent
 *
 * @param feedbackIds - IDs of the updated feedback items
 * @param action - The bulk action that was performed
 * @param projectId - Project ID for the bulk update
 * @returns Number of clients notified
 */
export function broadcastFeedbackBulkUpdate(
  feedbackIds: string[],
  action: BulkUpdateAction,
  projectId: string
): number {
  const event = createFeedbackBulkUpdateEvent(feedbackIds, action);
  return broadcastToProject(projectId, event);
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get WebSocket statistics
 */
export interface WebSocketStats {
  connectedClients: number;
  channels: {
    name: string;
    subscribers: number;
  }[];
}

/**
 * Get current WebSocket statistics
 */
export function getWebSocketStats(): WebSocketStats {
  const channels = Array.from(channelSubscriptions.entries()).map(([name, subscribers]) => ({
    name,
    subscribers: subscribers.size,
  }));

  return {
    connectedClients: clients.size,
    channels,
  };
}
