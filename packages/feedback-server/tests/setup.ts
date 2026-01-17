/**
 * Test Setup and Fixtures
 *
 * Shared test utilities, fixtures, and setup for all test types.
 */

import { Hono } from "hono";
import { beforeEach, afterEach } from "vitest";

// Re-export Hono app for testing
export { Hono };

/**
 * Default test server URL - can be overridden via TEST_BASE_URL env var
 */
export const DEFAULT_BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

/**
 * Test configuration - overrides for testing
 */
export const testConfig = {
  port: 0, // Random port
  host: "127.0.0.1",
  nodeEnv: "test" as const,
  isDevelopment: false,
  isProduction: false,
  isTest: true,
  databaseUrl: ":memory:",
  uploadDir: "/tmp/test-uploads",
  maxUploadSize: 10 * 1024 * 1024, // 10MB for tests
  videoChunkSize: 1024 * 1024,
  videoMaxDuration: 60,
  authEnabled: false,
  authType: "apikey" as const,
  apiKey: "test-api-key-12345",
  jwtSecret: "test-jwt-secret-12345",
  apiKeySalt: "test-salt",
  corsOrigins: ["*"],
  rateLimitWindowMs: 60000,
  rateLimitMaxRequests: 1000,
  logLevel: "error" as const,
  logFormat: "json" as const,
  enableVideoUpload: true,
  enableWebsocket: true,
  enableCompression: false,
};

/**
 * Create a test feedback item
 */
export function createTestFeedback(overrides: Partial<TestFeedbackInput> = {}): TestFeedbackInput {
  return {
    projectId: "test-project",
    sessionId: `session-${Date.now()}`,
    title: "Test Feedback",
    description: "This is a test feedback item",
    type: "bug",
    priority: "medium",
    userEmail: "test@example.com",
    userName: "Test User",
    environment: {
      userAgent: "Mozilla/5.0 Test Browser",
      browser: "Chrome",
      browserVersion: "120.0.0",
      os: "macOS",
      viewportWidth: 1920,
      viewportHeight: 1080,
      devicePixelRatio: 2,
      url: "https://example.com/test",
      pageTitle: "Test Page",
    },
    tags: ["test", "automated"],
    metadata: { testRun: true },
    ...overrides,
  };
}

/**
 * Create multiple test feedback items
 */
export function createTestFeedbackBatch(count: number, projectId = "test-project"): TestFeedbackInput[] {
  return Array.from({ length: count }, (_, i) =>
    createTestFeedback({
      projectId,
      title: `Feedback ${i + 1}`,
      sessionId: `session-${i + 1}`,
    })
  );
}

/**
 * Create a test video blob (mock)
 */
export function createTestVideoBlob(): { data: ArrayBuffer; mimeType: string } {
  // Create a minimal valid webm header (mock)
  const header = new Uint8Array([
    0x1a, 0x45, 0xdf, 0xa3, // EBML header
    0x01, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x1f,
  ]);
  return {
    data: header.buffer,
    mimeType: "video/webm",
  };
}

/**
 * Create a test screenshot (base64)
 */
export function createTestScreenshot(): TestScreenshot {
  // Minimal PNG (1x1 pixel)
  const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  return {
    mimeType: "image/png",
    data: pngBase64,
    width: 1,
    height: 1,
  };
}

/**
 * Test environment helper interface
 */
export interface TestEnvironment {
  userAgent: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  devicePixelRatio?: number;
  url: string;
  pageTitle?: string;
}

/**
 * Test screenshot interface
 */
export interface TestScreenshot {
  mimeType: string;
  data: string;
  width?: number;
  height?: number;
  annotations?: unknown[];
}

/**
 * Test feedback input interface
 */
export interface TestFeedbackInput {
  projectId: string;
  sessionId: string;
  title: string;
  description?: string;
  type?: "bug" | "feature" | "improvement" | "question" | "other";
  priority?: "low" | "medium" | "high" | "critical";
  userEmail?: string;
  userName?: string;
  environment?: TestEnvironment;
  tags?: string[];
  metadata?: Record<string, unknown>;
  screenshots?: TestScreenshot[];
  consoleLogs?: TestConsoleLog[];
  networkRequests?: TestNetworkRequest[];
}

/**
 * Test console log interface
 */
export interface TestConsoleLog {
  level: "log" | "info" | "warn" | "error" | "debug";
  message: string;
  timestamp: string;
  data?: unknown[];
}

/**
 * Test network request interface
 */
export interface TestNetworkRequest {
  url: string;
  method: string;
  status?: number;
  duration?: number;
  timestamp: string;
  success: boolean;
  error?: string;
}

/**
 * HTTP test helper - make requests to the test server
 */
export class TestClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(baseUrl = "http://localhost:3001") {
    this.baseUrl = baseUrl;
    this.headers = {
      "Content-Type": "application/json",
    };
  }

  setApiKey(apiKey: string): void {
    this.headers["X-API-Key"] = apiKey;
  }

  setAuthToken(token: string): void {
    this.headers["Authorization"] = `Bearer ${token}`;
  }

  clearAuth(): void {
    delete this.headers["X-API-Key"];
    delete this.headers["Authorization"];
  }

  async get<T = unknown>(path: string): Promise<TestResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "GET",
      headers: this.headers,
    });
    return this.parseResponse<T>(response);
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<TestResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.parseResponse<T>(response);
  }

  async put<T = unknown>(path: string, body?: unknown): Promise<TestResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "PUT",
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.parseResponse<T>(response);
  }

  async patch<T = unknown>(path: string, body?: unknown): Promise<TestResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "PATCH",
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.parseResponse<T>(response);
  }

  async delete<T = unknown>(path: string, body?: unknown): Promise<TestResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "DELETE",
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.parseResponse<T>(response);
  }

  private async parseResponse<T>(response: Response): Promise<TestResponse<T>> {
    const contentType = response.headers.get("content-type");
    let data: T | undefined;

    if (contentType?.includes("application/json")) {
      data = await response.json() as T;
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data,
      ok: response.ok,
    };
  }
}

/**
 * Test response interface
 */
export interface TestResponse<T = unknown> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data?: T;
  ok: boolean;
}

/**
 * Create a test client instance
 */
export function createTestClient(baseUrl = "http://localhost:3001"): TestClient {
  return new TestClient(baseUrl);
}

/**
 * Wait for condition with timeout
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Wait for server to be ready
 */
export async function waitForServer(
  baseUrl = "http://localhost:3001",
  timeout = 10000
): Promise<void> {
  const client = createTestClient(baseUrl);
  await waitFor(
    async () => {
      try {
        const response = await client.get("/api/v1/health");
        return response.ok;
      } catch {
        return false;
      }
    },
    timeout,
    500
  );
}

/**
 * Generate a unique ID for tests
 */
export function uniqueId(prefix = "test"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Sleep helper
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a request if rate limited
 */
export async function retryOnRateLimit<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    const result = await fn() as unknown as { status?: number };
    if (result?.status !== 429) {
      return result as T;
    }
    // Wait with exponential backoff
    await sleep(baseDelay * Math.pow(2, i));
  }
  return fn();
}
