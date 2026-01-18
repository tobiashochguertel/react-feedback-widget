/**
 * TypeScript Types
 *
 * Type definitions for the CLI.
 */

/**
 * Feedback status values
 */
export type FeedbackStatus =
  | 'new'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'closed';

/**
 * Feedback type values
 */
export type FeedbackType = 'bug' | 'feature' | 'improvement' | 'question';

/**
 * Feedback priority values
 */
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Feedback item
 */
export interface Feedback {
  id: string;
  title: string;
  description?: string;
  type: FeedbackType;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  url?: string;
  userAgent?: string;
  screenshot?: string;
  video?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Feedback list response
 */
export interface FeedbackListResponse {
  items: Feedback[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Parameters for listing feedback
 */
export interface ListFeedbackParams {
  status?: FeedbackStatus | undefined;
  type?: FeedbackType | undefined;
  priority?: FeedbackPriority | undefined;
  fromDate?: string | undefined;
  toDate?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

/**
 * Feedback statistics
 */
export interface FeedbackStats {
  total: number;
  byStatus: Record<FeedbackStatus, number>;
  byType: Record<FeedbackType, number>;
  byPriority: Record<FeedbackPriority, number>;
}
