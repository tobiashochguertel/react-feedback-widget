import "@typespec/http";

using Http;

namespace FeedbackServer.Models;

/**
 * Feedback item status
 */
enum FeedbackStatus {
  pending,
  inProgress: "in_progress",
  resolved,
  closed,
  archived,
}

/**
 * Feedback type/category
 */
enum FeedbackType {
  bug,
  feature,
  improvement,
  question,
  other,
}

/**
 * Feedback priority level
 */
enum FeedbackPriority {
  low,
  medium,
  high,
  critical,
}

/**
 * Browser/environment information
 */
model EnvironmentInfo {
  /** User agent string */
  userAgent: string;

  /** Browser name */
  browser?: string;

  /** Browser version */
  browserVersion?: string;

  /** Operating system */
  os?: string;

  /** Viewport width */
  viewportWidth?: int32;

  /** Viewport height */
  viewportHeight?: int32;

  /** Device pixel ratio */
  devicePixelRatio?: float32;

  /** Current URL */
  url: string;

  /** Page title */
  pageTitle?: string;
}

/**
 * Screenshot attachment
 */
model Screenshot {
  /** Unique identifier */
  id: string;

  /** MIME type (image/png, image/jpeg, image/webp) */
  mimeType: string;

  /** Base64 encoded image data or URL */
  data: string;

  /** Screenshot width */
  width?: int32;

  /** Screenshot height */
  height?: int32;

  /** Timestamp when screenshot was taken */
  @format("date-time")
  capturedAt: string;

  /** Annotations/markups on the screenshot */
  annotations?: Annotation[];
}

/**
 * Annotation on a screenshot
 */
model Annotation {
  /** Annotation type */
  type: "rectangle" | "arrow" | "text" | "highlight" | "blur";

  /** X coordinate */
  x: float32;

  /** Y coordinate */
  y: float32;

  /** Width (for rectangles) */
  width?: float32;

  /** Height (for rectangles) */
  height?: float32;

  /** End X coordinate (for arrows) */
  endX?: float32;

  /** End Y coordinate (for arrows) */
  endY?: float32;

  /** Text content (for text annotations) */
  text?: string;

  /** Color (hex or rgba) */
  color?: string;

  /** Stroke width */
  strokeWidth?: float32;
}

/**
 * Console log entry
 */
model ConsoleLog {
  /** Log level */
  level: "log" | "info" | "warn" | "error" | "debug";

  /** Log message */
  message: string;

  /** Timestamp */
  @format("date-time")
  timestamp: string;

  /** Additional data/arguments */
  data?: unknown[];
}

/**
 * Network request info
 */
model NetworkRequest {
  /** Request URL */
  url: string;

  /** HTTP method */
  method: string;

  /** HTTP status code */
  status?: int32;

  /** Response time in milliseconds */
  duration?: int32;

  /** Request timestamp */
  @format("date-time")
  timestamp: string;

  /** Was the request successful */
  success: boolean;

  /** Error message if failed */
  error?: string;
}

/**
 * Feedback item
 */
model Feedback {
  /** Unique identifier */
  id: string;

  /** Project/app identifier */
  projectId: string;

  /** Client session ID */
  sessionId: string;

  /** Feedback title/summary */
  title: string;

  /** Detailed description */
  description?: string;

  /** Feedback type */
  type: FeedbackType;

  /** Current status */
  status: FeedbackStatus;

  /** Priority level */
  priority: FeedbackPriority;

  /** Environment information */
  environment: EnvironmentInfo;

  /** Attached screenshots */
  screenshots?: Screenshot[];

  /** Console logs captured */
  consoleLogs?: ConsoleLog[];

  /** Network requests captured */
  networkRequests?: NetworkRequest[];

  /** Video recording ID (if attached) */
  videoId?: string;

  /** User-provided email (optional) */
  userEmail?: string;

  /** User-provided name (optional) */
  userName?: string;

  /** Custom metadata */
  metadata?: Record<unknown>;

  /** Tags/labels */
  tags?: string[];

  /** Creation timestamp */
  @format("date-time")
  createdAt: string;

  /** Last update timestamp */
  @format("date-time")
  updatedAt: string;

  /** Sync timestamp (for offline support) */
  @format("date-time")
  syncedAt?: string;
}

/**
 * Create feedback request
 */
model CreateFeedbackRequest {
  /** Project/app identifier */
  projectId: string;

  /** Client session ID */
  sessionId: string;

  /** Feedback title/summary */
  title: string;

  /** Detailed description */
  description?: string;

  /** Feedback type */
  type: FeedbackType;

  /** Priority level */
  priority?: FeedbackPriority;

  /** Environment information */
  environment: EnvironmentInfo;

  /** Attached screenshots */
  screenshots?: Screenshot[];

  /** Console logs captured */
  consoleLogs?: ConsoleLog[];

  /** Network requests captured */
  networkRequests?: NetworkRequest[];

  /** Video recording ID (if attached) */
  videoId?: string;

  /** User-provided email (optional) */
  userEmail?: string;

  /** User-provided name (optional) */
  userName?: string;

  /** Custom metadata */
  metadata?: Record<unknown>;

  /** Tags/labels */
  tags?: string[];
}

/**
 * Update feedback request
 */
model UpdateFeedbackRequest {
  /** Feedback title/summary */
  title?: string;

  /** Detailed description */
  description?: string;

  /** Feedback type */
  type?: FeedbackType;

  /** Current status */
  status?: FeedbackStatus;

  /** Priority level */
  priority?: FeedbackPriority;

  /** Tags/labels */
  tags?: string[];

  /** Custom metadata */
  metadata?: Record<unknown>;
}

/**
 * Paginated list response
 */
model PaginatedFeedbackList {
  /** List of feedback items */
  data: Feedback[];

  /** Total count */
  total: int64;

  /** Current page */
  page: int32;

  /** Items per page */
  pageSize: int32;

  /** Total pages */
  totalPages: int32;

  /** Has more pages */
  hasMore: boolean;
}
