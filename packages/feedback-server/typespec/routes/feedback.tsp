import "@typespec/http";
import "@typespec/rest";
import "../models/feedback.tsp";

using Http;
using Rest;

namespace FeedbackServer.Routes;

@route("/api/v1/feedback")
@tag("Feedback")
interface FeedbackRoutes {
  /**
   * List all feedback items with pagination and filtering
   */
  @get
  @summary("List feedback items")
  list(
    /** Project ID filter */
    @query projectId?: string,

    /** Status filter */
    @query status?: Models.FeedbackStatus,

    /** Type filter */
    @query type?: Models.FeedbackType,

    /** Priority filter */
    @query priority?: Models.FeedbackPriority,

    /** Search query */
    @query search?: string,

    /** Page number (1-based) */
    @query page?: int32 = 1,

    /** Items per page */
    @query pageSize?: int32 = 20,

    /** Sort field */
    @query sortBy?:
      | "createdAt"
      | "updatedAt"
      | "priority"
      | "status" = "createdAt",

    /** Sort order */
    @query sortOrder?: "asc" | "desc" = "desc",
  ): Models.PaginatedFeedbackList;

  /**
   * Create a new feedback item
   */
  @post
  @summary("Create feedback")
  create(@body body: Models.CreateFeedbackRequest): {
    @statusCode statusCode: 201;
    @body body: Models.Feedback;
  };

  /**
   * Get a specific feedback item by ID
   */
  @get
  @route("/{id}")
  @summary("Get feedback by ID")
  get(@path id: string): Models.Feedback | {
    @statusCode statusCode: 404;
    @body body: {
      error: string;
      message: string;
    };
  };

  /**
   * Update a feedback item
   */
  @patch
  @route("/{id}")
  @summary("Update feedback")
  update(
    @path id: string,
    @body body: Models.UpdateFeedbackRequest,
  ): Models.Feedback | {
    @statusCode statusCode: 404;
    @body body: {
      error: string;
      message: string;
    };
  };

  /**
   * Delete a feedback item
   */
  @delete
  @route("/{id}")
  @summary("Delete feedback")
  delete(@path id: string): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 404;
    @body body: {
      error: string;
      message: string;
    };
  };

  /**
   * Bulk update feedback items
   */
  @patch
  @route("/bulk")
  @summary("Bulk update feedback items")
  bulkUpdate(
    @body body: {
      /** IDs to update */
      ids: string[];

      /** Update data */
      update: Models.UpdateFeedbackRequest;
    },
  ): {
    /** Number of items updated */
    updated: int32;

    /** IDs that were updated */
    updatedIds: string[];
  };

  /**
   * Bulk delete feedback items
   */
  @delete
  @route("/bulk")
  @summary("Bulk delete feedback items")
  bulkDelete(
    @body body: {
      /** IDs to delete */
      ids: string[];
    },
  ): {
    /** Number of items deleted */
    deleted: int32;
  };

  /**
   * Export feedback items
   */
  @get
  @route("/export")
  @summary("Export feedback data")
  export(
    /** Project ID filter */
    @query projectId?: string,

    /** Export format */
    @query format?: "json" | "csv" = "json",

    /** Include screenshots */
    @query includeScreenshots?: boolean = false,
  ): {
    @header contentType: "application/json" | "text/csv";
    @body body: bytes;
  };

  /**
   * Get feedback statistics
   */
  @get
  @route("/stats")
  @summary("Get feedback statistics")
  stats(
    /** Project ID filter */
    @query projectId?: string,

    /** Start date for stats period */
    @query startDate?: string,

    /** End date for stats period */
    @query endDate?: string,
  ): {
    /** Total feedback count */
    total: int64;

    /** Count by status */
    byStatus: Record<int32>;

    /** Count by type */
    byType: Record<int32>;

    /** Count by priority */
    byPriority: Record<int32>;

    /** Feedback over time (daily counts) */
    timeline: {
      date: string;
      count: int32;
    }[];
  };
}
