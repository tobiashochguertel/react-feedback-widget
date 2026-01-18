/**
 * TypeScript Types
 *
 * Re-exports from @feedback/api-types for API-First architecture.
 * This ensures type consistency with the API specification.
 *
 * @see packages/feedback-server-api/typespec/ for the source of truth
 */

// ============================================================================
// Re-export types from @feedback/api-types (generated from TypeSpec)
// ============================================================================

export type {
  // Core feedback types
  Feedback,
  FeedbackStatus,
  FeedbackType,
  FeedbackPriority,

  // Request/Response types
  CreateFeedbackRequest,
  UpdateFeedbackRequest,
  PaginatedFeedbackList,
  FeedbackStatsResponse,

  // Additional types for completeness
  EnvironmentInfo,
  Screenshot,
  ConsoleLog,
  NetworkRequest,
  Annotation,

  // Video types
  Video,
  VideoStatus,
} from "@feedback/api-types";

// Import for local use
import type { PaginatedFeedbackList, FeedbackStatsResponse } from "@feedback/api-types";

// ============================================================================
// CLI-Specific Types (not from API)
// ============================================================================

/**
 * Parameters for listing feedback (CLI-specific with optional fields)
 * Maps to FeedbackListQuery from API but with CLI-friendly naming
 */
export interface ListFeedbackParams {
  status?: string | undefined;
  type?: string | undefined;
  priority?: string | undefined;
  fromDate?: string | undefined;
  toDate?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

/**
 * CLI Output format options
 */
export type OutputFormat = 'json' | 'yaml' | 'table';

/**
 * CLI Configuration options
 */
export interface CLIConfig {
  serverUrl?: string;
  requestTimeout?: number;
  maxRetries?: number;
  defaultOutputFormat?: OutputFormat;
}

// ============================================================================
// Compatibility Type Aliases
// ============================================================================

/**
 * Alias for PaginatedFeedbackList (API uses 'data', not 'items')
 * @see PaginatedFeedbackList
 */
export type FeedbackListResponse = PaginatedFeedbackList;

/**
 * Alias for FeedbackStatsResponse
 * @see FeedbackStatsResponse
 */
export type FeedbackStats = FeedbackStatsResponse;

