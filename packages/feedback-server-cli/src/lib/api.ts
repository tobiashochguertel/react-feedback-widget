/**
 * API Client
 *
 * Typed HTTP client for communicating with the Feedback Server API.
 * Handles authentication, request/response logging, error handling, and retries.
 */

import { configManager } from './config.js';
import { authManager } from './auth.js';
import { logger } from '../utils/logger.js';
import type { Feedback, FeedbackListResponse, FeedbackStats, ListFeedbackParams } from '../types/index.js';

/**
 * Error thrown by the API client
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * HTTP client configuration
 */
interface ClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

/**
 * API Client class for making HTTP requests to the Feedback Server
 */
class ApiClient {
  private config: ClientConfig = {
    baseUrl: '',
    timeout: 30000,
    retries: 3,
  };

  /**
   * Initialize the client with the server URL
   */
  async initialize(): Promise<void> {
    // Get server URL from config or environment
    const serverUrl =
      process.env.FEEDBACK_SERVER_URL ??
      configManager.get('serverUrl') ??
      'http://localhost:3000';

    this.config.baseUrl = serverUrl;
    this.config.timeout = configManager.get('requestTimeout') ?? 30000;
    this.config.retries = configManager.get('maxRetries') ?? 3;
  }

  /**
   * Get the base URL
   */
  getBaseUrl(): string {
    return this.config.baseUrl || configManager.get('serverUrl') || 'http://localhost:3000';
  }

  /**
   * Make an HTTP request
   */
  private async request<T>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      params?: Record<string, string | number | undefined>;
      retries?: number;
    } = {}
  ): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const url = new URL(path, baseUrl);

    // Add query parameters
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    // Get auth token
    const token = await authManager.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    logger.debug(`${method} ${url.toString()}`);

    const retries = options.retries ?? this.config.retries;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const fetchOptions: RequestInit = {
          method,
          headers,
          signal: controller.signal,
        };

        if (options.body) {
          fetchOptions.body = JSON.stringify(options.body);
        }

        const response = await fetch(url.toString(), fetchOptions);

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
          throw new ApiError(
            String(errorData.message ?? `HTTP ${response.status} ${response.statusText}`),
            response.status,
            errorData.code ? String(errorData.code) : undefined
          );
        }

        const data = await response.json();
        logger.debug(`Response: ${JSON.stringify(data).slice(0, 200)}...`);

        return data as T;
      } catch (error) {
        // Don't retry on non-retryable errors
        if (error instanceof ApiError && error.status < 500) {
          throw error;
        }

        if (attempt === retries) {
          throw error;
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        logger.debug(`Retry ${attempt + 1}/${retries} after ${delay}ms`);
        await sleep(delay);
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * List feedback items with filtering and pagination
   */
  async listFeedback(params: ListFeedbackParams = {}): Promise<FeedbackListResponse> {
    await this.initialize();

    return this.request<FeedbackListResponse>('GET', '/api/feedback', {
      params: {
        status: params.status,
        type: params.type,
        priority: params.priority,
        from: params.fromDate,
        to: params.toDate,
        limit: params.limit,
        offset: params.offset,
      },
    });
  }

  /**
   * Get a single feedback item by ID
   */
  async getFeedback(id: string): Promise<Feedback> {
    await this.initialize();

    return this.request<Feedback>('GET', `/api/feedback/${id}`);
  }

  /**
   * Create a new feedback item
   */
  async createFeedback(data: Omit<Feedback, 'id' | 'createdAt' | 'updatedAt'>): Promise<Feedback> {
    await this.initialize();

    return this.request<Feedback>('POST', '/api/feedback', {
      body: data,
    });
  }

  /**
   * Update a feedback item
   */
  async updateFeedback(id: string, data: Partial<Feedback>): Promise<Feedback> {
    await this.initialize();

    return this.request<Feedback>('PATCH', `/api/feedback/${id}`, {
      body: data,
    });
  }

  /**
   * Delete a feedback item
   */
  async deleteFeedback(id: string): Promise<void> {
    await this.initialize();

    await this.request<void>('DELETE', `/api/feedback/${id}`);
  }

  /**
   * Get feedback statistics
   */
  async getStats(): Promise<FeedbackStats> {
    await this.initialize();

    return this.request<FeedbackStats>('GET', '/api/feedback/stats');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string }> {
    await this.initialize();

    return this.request<{ status: string }>('GET', '/health');
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Export singleton instance
export const apiClient = new ApiClient();
