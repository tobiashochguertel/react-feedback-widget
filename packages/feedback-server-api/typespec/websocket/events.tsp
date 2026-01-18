/**
 * WebSocket Server Events
 *
 * Defines server-to-client events for real-time feedback updates.
 * These events are broadcast to subscribed clients when feedback items change.
 *
 * @see docs/spec/001.websocket-addon-specification/README.md
 */
import "@typespec/json-schema";

using TypeSpec.JsonSchema;

namespace FeedbackServer.WebSocket;

/**
 * Server-to-Client Events sent over WebSocket
 * 
 * This union type represents all possible events that the server can send
 * to connected clients. Each event has a `type` discriminator field.
 */
@jsonSchema
union ServerEvents {
  /** Feedback item was created */
  feedbackCreated: FeedbackCreatedEvent,

  /** Feedback item was updated */
  feedbackUpdated: FeedbackUpdatedEvent,

  /** Feedback item was deleted */
  feedbackDeleted: FeedbackDeletedEvent,

  /** Multiple feedback items updated (bulk operation) */
  feedbackBulkUpdate: FeedbackBulkUpdateEvent,

  /** Connection acknowledged by server */
  connectionAck: ConnectionAckEvent,

  /** Subscription confirmed */
  subscriptionConfirmed: SubscriptionConfirmedEvent,

  /** Error occurred */
  error: ErrorEvent,

  /** Pong response to ping */
  pong: PongEvent,
}

// ============================================================================
// Feedback Events
// ============================================================================

/** Emitted when a new feedback item is created */
model FeedbackCreatedEvent {
  /** Event type discriminator */
  type: "feedback.created";
  
  /** ISO 8601 timestamp when event occurred */
  @format("date-time")
  timestamp: string;
  
  /** The created feedback item */
  feedback: FeedbackServer.Models.Feedback;
}

/** Emitted when a feedback item is updated */
model FeedbackUpdatedEvent {
  /** Event type discriminator */
  type: "feedback.updated";
  
  /** ISO 8601 timestamp when event occurred */
  @format("date-time")
  timestamp: string;
  
  /** The updated feedback item */
  feedback: FeedbackServer.Models.Feedback;
  
  /** List of fields that were changed */
  changedFields: string[];
}

/** Emitted when a feedback item is deleted */
model FeedbackDeletedEvent {
  /** Event type discriminator */
  type: "feedback.deleted";
  
  /** ISO 8601 timestamp when event occurred */
  @format("date-time")
  timestamp: string;
  
  /** ID of the deleted feedback */
  feedbackId: string;
}

/** Emitted when multiple feedback items are updated in bulk */
model FeedbackBulkUpdateEvent {
  /** Event type discriminator */
  type: "feedback.bulk_update";
  
  /** ISO 8601 timestamp when event occurred */
  @format("date-time")
  timestamp: string;
  
  /** IDs of updated feedback items */
  feedbackIds: string[];
  
  /** Action that was performed */
  action: BulkUpdateAction;
}

/** Possible bulk update actions */
enum BulkUpdateAction {
  statusChange: "status_change",
  priorityChange: "priority_change",
  archive: "archive",
  delete: "delete",
}

// ============================================================================
// Connection Events
// ============================================================================

/** Emitted when WebSocket connection is established */
model ConnectionAckEvent {
  /** Event type discriminator */
  type: "connection.ack";
  
  /** ISO 8601 timestamp when connection was established */
  @format("date-time")
  timestamp: string;
  
  /** Unique connection identifier assigned by server */
  connectionId: string;
  
  /** Server version for compatibility checking */
  serverVersion: string;
}

/** Emitted when subscription is successfully confirmed */
model SubscriptionConfirmedEvent {
  /** Event type discriminator */
  type: "subscription.confirmed";
  
  /** ISO 8601 timestamp when subscription was confirmed */
  @format("date-time")
  timestamp: string;
  
  /** Channel that was subscribed to */
  channel: string;
}

// ============================================================================
// Utility Events
// ============================================================================

/** Emitted when an error occurs */
model ErrorEvent {
  /** Event type discriminator */
  type: "error";
  
  /** ISO 8601 timestamp when error occurred */
  @format("date-time")
  timestamp: string;
  
  /** Error code for programmatic handling */
  code: ErrorCode;
  
  /** Human-readable error message */
  message: string;
  
  /** Optional additional details */
  details?: Record<string>;
}

/** Possible WebSocket error codes */
enum ErrorCode {
  invalidCommand: "INVALID_COMMAND",
  unauthorized: "UNAUTHORIZED",
  subscriptionFailed: "SUBSCRIPTION_FAILED",
  internalError: "INTERNAL_ERROR",
}

/** Response to ping command (keep-alive) */
model PongEvent {
  /** Event type discriminator */
  type: "pong";
  
  /** ISO 8601 timestamp of pong response */
  @format("date-time")
  timestamp: string;
}
