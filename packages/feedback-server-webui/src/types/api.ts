/**
 * @file API Types for WebUI
 *
 * Re-exports types from @feedback/api-types workspace package.
 * This provides a consistent import path for all API-related types.
 *
 * @example
 * import type { Feedback, FeedbackStatus, PaginatedFeedbackList } from "@/types/api";
 */

// Re-export all types from the shared package
export type {
  // Model types
  Feedback,
  CreateFeedbackRequest,
  UpdateFeedbackRequest,
  FeedbackType,
  FeedbackStatus,
  FeedbackPriority,
  EnvironmentInfo,
  Screenshot,
  ConsoleLog,
  NetworkRequest,
  Annotation,
  PaginatedFeedbackList,
  // Video types
  Video,
  VideoStatus,
  InitVideoUploadRequest,
  InitVideoUploadResponse,
  CompleteVideoUploadRequest,
  ChunkUploadResponse,
  // Health types
  HealthStatus,
  ComponentHealth,
  HealthResponse,
  // OpenAPI types
  components,
  operations,
  paths,
} from "@feedback/api-types";

/**
 * Dashboard statistics response
 */
export interface DashboardStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

/**
 * Feedback list query parameters
 */
export interface FeedbackListParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  priority?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
