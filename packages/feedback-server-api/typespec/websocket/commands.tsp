/**
 * WebSocket Client Commands
 *
 * Defines client-to-server commands for WebSocket communication.
 * These commands are sent by clients to subscribe, unsubscribe, and authenticate.
 *
 * @see docs/spec/001.websocket-addon-specification/README.md
 */
import "@typespec/json-schema";
import "../models/feedback.tsp";

using TypeSpec.JsonSchema;

namespace FeedbackServer.WebSocket;

/**
 * Client-to-Server Commands sent over WebSocket
 *
 * This union type represents all possible commands that clients can send
 * to the server. Each command has a `type` discriminator field.
 */
@jsonSchema
union ClientCommands {
  /** Subscribe to events for a channel */
  subscribe: SubscribeCommand,

  /** Unsubscribe from a channel */
  unsubscribe: UnsubscribeCommand,

  /** Ping to keep connection alive */
  ping: PingCommand,

  /** Authenticate the WebSocket connection */
  authenticate: AuthenticateCommand,
}

// ============================================================================
// Subscription Commands
// ============================================================================

/** Subscribe to a specific channel or set of events */
model SubscribeCommand {
  /** Command type discriminator */
  type: "subscribe";

  /**
   * Channel to subscribe to.
   * Examples: "feedback", "feedback:project-123", "feedback:item-456"
   */
  channel: string;

  /** Optional filters to narrow down events */
  filters?: SubscriptionFilters;
}

/** Filters for subscription to reduce noise */
model SubscriptionFilters {
  /** Filter by feedback types */
  types?: FeedbackServer.Models.FeedbackType[];

  /** Filter by feedback statuses */
  statuses?: FeedbackServer.Models.FeedbackStatus[];

  /** Filter by project ID */
  projectId?: string;

  /** Filter by priority levels */
  priorities?: FeedbackServer.Models.FeedbackPriority[];
}

/** Unsubscribe from a channel */
model UnsubscribeCommand {
  /** Command type discriminator */
  type: "unsubscribe";

  /** Channel to unsubscribe from */
  channel: string;
}

// ============================================================================
// Utility Commands
// ============================================================================

/** Ping command to keep connection alive */
model PingCommand {
  /** Command type discriminator */
  type: "ping";

  /** Optional client timestamp for latency measurement */
  @format("date-time")
  timestamp?: string;
}

/** Authenticate the WebSocket connection */
model AuthenticateCommand {
  /** Command type discriminator */
  type: "authenticate";

  /** API key for authentication (simple auth) */
  apiKey?: string;

  /** JWT token for authentication (token-based auth) */
  token?: string;
}
