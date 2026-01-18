/**
 * @file API Client
 *
 * Typed HTTP client for the Feedback Server API.
 * Provides type-safe methods for all API operations.
 */

import type {
  Feedback,
  CreateFeedbackRequest,
  UpdateFeedbackRequest,
  PaginatedFeedbackList,
  HealthResponse,
  DashboardStats,
  FeedbackListParams,
} from "@/types/api";

/**
 * API error class with typed response
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * API client configuration
 */
interface ApiClientConfig {
  baseUrl: string;
  apiKey?: string | undefined;
}

/**
 * Create a typed API client
 */
export function createApiClient(config: ApiClientConfig) {
  const { baseUrl, apiKey } = config;

  /**
   * Make an API request with proper headers and error handling
   */
  async function request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (apiKey) {
      (headers as Record<string, string>)["X-API-Key"] = apiKey;
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new ApiError(response.status, data.message || response.statusText, data);
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  return {
    /**
     * Health check endpoint
     */
    health: {
      check: () => request<HealthResponse>("/api/v1/health"),
    },

    /**
     * Feedback endpoints
     */
    feedback: {
      /**
       * Get paginated list of feedback items
       */
      list: (params?: FeedbackListParams) => {
        const searchParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== "") {
              searchParams.set(key, String(value));
            }
          });
        }
        const query = searchParams.toString();
        return request<PaginatedFeedbackList>(
          `/api/v1/feedback${query ? `?${query}` : ""}`
        );
      },

      /**
       * Get dashboard statistics
       */
      stats: () => request<DashboardStats>("/api/v1/feedback/stats"),

      /**
       * Get a single feedback item by ID
       */
      get: (id: string) => request<Feedback>(`/api/v1/feedback/${id}`),

      /**
       * Create a new feedback item
       */
      create: (data: CreateFeedbackRequest) =>
        request<Feedback>("/api/v1/feedback", {
          method: "POST",
          body: JSON.stringify(data),
        }),

      /**
       * Update an existing feedback item
       */
      update: (id: string, data: UpdateFeedbackRequest) =>
        request<Feedback>(`/api/v1/feedback/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),

      /**
       * Delete a feedback item
       */
      delete: (id: string) =>
        request<void>(`/api/v1/feedback/${id}`, {
          method: "DELETE",
        }),
    },
  };
}

/**
 * API client type
 */
export type ApiClient = ReturnType<typeof createApiClient>;
