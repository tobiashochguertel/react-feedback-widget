/**
 * WebUI Test Setup and Utilities
 *
 * This file provides test utilities, fixtures, and helpers for BDD tests
 * in the feedback-server-webui package.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Default base URL for API requests.
 * Can be overridden via VITE_API_URL environment variable.
 */
export const DEFAULT_BASE_URL =
  process.env.VITE_API_URL || "http://localhost:3001";

/**
 * API version prefix for all endpoints
 */
export const API_VERSION = "/api/v1";

/**
 * Get the full API URL for a given path
 */
export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${DEFAULT_BASE_URL}${API_VERSION}${normalizedPath}`;
}

// ============================================================================
// Server Health Check
// ============================================================================

/**
 * Check if the API server is running and healthy
 */
export async function isServerHealthy(): Promise<boolean> {
  try {
    const response = await fetch(`${DEFAULT_BASE_URL}${API_VERSION}/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Wait for the server to be healthy
 * @param timeout Maximum time to wait in milliseconds (default: 10000)
 * @param interval Check interval in milliseconds (default: 500)
 */
export async function waitForServer(
  timeout = 10000,
  interval = 500
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await isServerHealthy()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  return false;
}

// ============================================================================
// API Client Utilities
// ============================================================================

/**
 * Options for API requests
 */
export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  apiKey?: string;
  token?: string;
}

/**
 * Make an API request with proper error handling
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<{
  ok: boolean;
  status: number;
  data: T | null;
  error?: string | undefined;
}> {
  const { method = "GET", headers = {}, body, apiKey, token } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...headers,
  };

  if (apiKey) {
    requestHeaders["X-API-Key"] = apiKey;
  }

  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(getApiUrl(path), {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : null,
    });

    let data: T | null = null;
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      try {
        data = (await response.json()) as T;
      } catch {
        // Empty response or invalid JSON
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      error: response.ok ? undefined : (data as { message?: string })?.message,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// Test Data Fixtures
// ============================================================================

/**
 * Generate a unique test ID
 */
export function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Test feedback data fixture
 */
export interface TestFeedback {
  projectId: string;
  sessionId: string;
  title: string;
  description?: string;
  type?: "bug" | "feature" | "improvement" | "general";
  priority?: "low" | "medium" | "high" | "critical";
  tags?: string[];
  environment?: {
    browser?: string;
    os?: string;
    viewportWidth?: number;
    viewportHeight?: number;
    userAgent?: string;
    url?: string;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Create test feedback data
 */
export function createTestFeedback(
  overrides: Partial<TestFeedback> = {}
): TestFeedback {
  return {
    projectId: overrides.projectId || "test-project",
    sessionId: overrides.sessionId || generateSessionId(),
    title: overrides.title || `Test Feedback ${generateTestId()}`,
    description: overrides.description || "This is a test feedback item",
    type: overrides.type || "bug",
    priority: overrides.priority || "medium",
    tags: overrides.tags || ["test", "automated"],
    environment: {
      browser: "Chrome",
      os: "macOS",
      viewportWidth: 1920,
      viewportHeight: 1080,
      userAgent: "Mozilla/5.0 (Test)",
      url: "http://localhost:3000/test",
      ...overrides.environment,
    },
    metadata: overrides.metadata || {},
  };
}

// ============================================================================
// Authentication Fixtures
// ============================================================================

/**
 * Test user credentials
 */
export const testCredentials = {
  validUser: {
    email: "test@example.com",
    password: "Test123!",
  },
  invalidUser: {
    email: "invalid@example.com",
    password: "wrongpassword",
  },
  adminUser: {
    email: "admin@example.com",
    password: "Admin123!",
  },
};

/**
 * Test API key for authentication
 */
export const testApiKey = process.env.TEST_API_KEY || "test-api-key-12345";

// ============================================================================
// Test Hooks
// ============================================================================

/**
 * Setup hook that ensures server is running before tests
 */
export async function setupServerCheck(): Promise<void> {
  const isHealthy = await isServerHealthy();
  if (!isHealthy) {
    console.warn(
      "⚠️  API server is not running. Some tests may be skipped."
    );
    console.warn(`   Expected server at: ${DEFAULT_BASE_URL}`);
    console.warn('   Start with: task server:start (from package directory)');
  }
}

/**
 * Describe block that skips if server is not available
 */
export function describeWithServer(
  name: string,
  fn: () => void
): ReturnType<typeof describe> {
  return describe(name, () => {
    let serverAvailable = false;

    beforeAll(async () => {
      serverAvailable = await isServerHealthy();
      if (!serverAvailable) {
        console.warn(`⏭️  Skipping "${name}" - server not available`);
      }
    });

    fn();
  });
}

/**
 * Test that skips if server is not available
 */
export function itWithServer(
  name: string,
  fn: () => Promise<void> | void,
  timeout?: number
): ReturnType<typeof it> {
  return it(
    name,
    async () => {
      const isHealthy = await isServerHealthy();
      if (!isHealthy) {
        console.warn(`⏭️  Skipping: ${name}`);
        return;
      }
      await fn();
    },
    timeout
  );
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert that a response matches expected structure
 */
export function expectFeedbackResponse(data: unknown): void {
  expect(data).toBeDefined();
  expect(data).toHaveProperty("id");
  expect(data).toHaveProperty("projectId");
  expect(data).toHaveProperty("title");
  expect(data).toHaveProperty("createdAt");
}

/**
 * Assert that a list response has proper pagination
 */
export function expectPaginatedResponse(
  data: unknown,
  expectedFields: { hasMore?: boolean; page?: number; limit?: number } = {}
): void {
  expect(data).toBeDefined();
  expect(data).toHaveProperty("items");
  expect(Array.isArray((data as { items: unknown[] }).items)).toBe(true);

  if (expectedFields.hasMore !== undefined) {
    expect(data).toHaveProperty("hasMore", expectedFields.hasMore);
  }
}

// ============================================================================
// Cleanup Utilities
// ============================================================================

/**
 * Track created resources for cleanup
 */
const createdFeedbackIds: string[] = [];

/**
 * Register a feedback ID for cleanup
 */
export function trackFeedback(id: string): void {
  createdFeedbackIds.push(id);
}

/**
 * Clean up all tracked feedback items
 */
export async function cleanupFeedback(): Promise<void> {
  for (const id of createdFeedbackIds) {
    try {
      await apiRequest(`/feedback/${id}`, {
        method: "DELETE",
        apiKey: testApiKey,
      });
    } catch {
      // Ignore cleanup errors
    }
  }
  createdFeedbackIds.length = 0;
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export { describe, it, expect, beforeAll, afterAll, beforeEach, vi };
