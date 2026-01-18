/**
 * WebSocket Module for Feedback Server
 *
 * This module provides WebSocket functionality for real-time updates.
 * It uses generated types from @feedback/api-types for type safety.
 *
 * @module websocket
 *
 * @example
 * ```typescript
 * import { websocketConfig, createClientData, upgradeToWebSocket } from './websocket';
 * import { broadcastFeedbackCreated } from './websocket';
 *
 * // Create Bun server with WebSocket support
 * Bun.serve({
 *   fetch(req, server) {
 *     if (upgradeToWebSocket(server, req)) {
 *       return;
 *     }
 *     return handleHttpRequest(req);
 *   },
 *   websocket: websocketConfig,
 * });
 *
 * // Notify clients of new feedback
 * broadcastFeedbackCreated(feedback);
 * ```
 */

// Export types
export * from './types';

// Export configuration
export {
  websocketConfig,
  createClientData,
  generateClientId,
  upgradeToWebSocket,
  getWebSocketStats,
  type ClientData,
} from './config';

// Export validator
export {
  parseAndValidateCommand,
  validateCommand,
  isCommandOfType,
  getErrorDescription,
  type ValidationResult,
  type ValidationErrorCode,
} from './validator';

// Export handlers
export {
  handleMessage,
  handleOpen,
  handleClose,
  handleError,
  handleSubscribe,
  handleUnsubscribe,
  handlePing,
  handleAuthenticate,
  type HandlerContext,
  type CommandHandler,
} from './handler';

// Export broadcaster
export {
  registerClient,
  unregisterClient,
  subscribeToChannel,
  unsubscribeFromChannel,
  getClientCount,
  getChannelSubscriberCount,
  broadcastToChannel,
  broadcastToAll,
  broadcastToProject,
  broadcastFeedbackCreated,
  broadcastFeedbackUpdated,
  broadcastFeedbackDeleted,
  broadcastFeedbackBulkUpdate,
  type WebSocketStats,
} from './broadcaster';
