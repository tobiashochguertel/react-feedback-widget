/**
 * Test Setup for feedback-server-cli
 *
 * This file runs before all tests to set up the test environment.
 */

import { afterEach, beforeEach, vi } from 'vitest';

// ============================================================================
// Test Server Configuration
// ============================================================================

/**
 * Default test server URL - can be overridden via TEST_BASE_URL env var
 * This follows the same pattern as feedback-server tests.
 */
export const DEFAULT_BASE_URL =
  process.env.TEST_BASE_URL || 'http://localhost:3001';

// ============================================================================
// Mock Console for CLI Output Testing
// ============================================================================

/**
 * Store original console methods for restoration
 */
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
};

/**
 * Mock console outputs for capturing CLI output in tests
 */
export const mockConsole = {
  logs: [] as string[],
  errors: [] as string[],
  warns: [] as string[],
  infos: [] as string[],

  clear() {
    this.logs = [];
    this.errors = [];
    this.warns = [];
    this.infos = [];
  },
};

// ============================================================================
// Environment Variables for Testing
// ============================================================================

/**
 * Default test environment variables
 */
const TEST_ENV = {
  // CLI test server URL (integration tests) - use DEFAULT_BASE_URL
  FEEDBACK_SERVER_URL: DEFAULT_BASE_URL,
  // Disable update notifier in tests
  NO_UPDATE_NOTIFIER: '1',
  // Disable color output for consistent snapshots
  FORCE_COLOR: '0',
  // Set test environment
  NODE_ENV: 'test',
};

// ============================================================================
// Global Test Hooks
// ============================================================================

beforeEach(() => {
  // Clear mock console
  mockConsole.clear();

  // Set test environment variables
  Object.entries(TEST_ENV).forEach(([key, value]) => {
    process.env[key] = value;
  });

  // Reset all mocks
  vi.clearAllMocks();
});

afterEach(() => {
  // Restore console if mocked
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
});

// ============================================================================
// Global Test Utilities
// ============================================================================

/**
 * Capture console output during test execution
 */
export function captureConsoleOutput() {
  console.log = (...args) => mockConsole.logs.push(args.join(' '));
  console.error = (...args) => mockConsole.errors.push(args.join(' '));
  console.warn = (...args) => mockConsole.warns.push(args.join(' '));
  console.info = (...args) => mockConsole.infos.push(args.join(' '));
}

/**
 * Restore original console
 */
export function restoreConsole() {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
}

/**
 * Create a mock CLI context for testing commands
 */
export function createMockCliContext(overrides = {}) {
  return {
    serverUrl: DEFAULT_BASE_URL,
    apiKey: 'test-api-key',
    projectId: 'test-project',
    verbose: false,
    quiet: false,
    ...overrides,
  };
}

/**
 * Wait for async operations to complete
 */
export function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// ============================================================================
// HTTP Test Client for CLI Integration Tests
// ============================================================================

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
 * HTTP test helper - make requests to the test server
 */
export class TestClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(baseUrl = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  setApiKey(apiKey: string): void {
    this.headers['X-API-Key'] = apiKey;
  }

  setAuthToken(token: string): void {
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  clearAuth(): void {
    delete this.headers['X-API-Key'];
    delete this.headers['Authorization'];
  }

  async get<T = unknown>(path: string): Promise<TestResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: this.headers,
    });
    return this.parseResponse<T>(response);
  }

  async post<T = unknown>(
    path: string,
    body?: unknown
  ): Promise<TestResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.parseResponse<T>(response);
  }

  async put<T = unknown>(
    path: string,
    body?: unknown
  ): Promise<TestResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.parseResponse<T>(response);
  }

  async patch<T = unknown>(
    path: string,
    body?: unknown
  ): Promise<TestResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.parseResponse<T>(response);
  }

  async delete<T = unknown>(
    path: string,
    body?: unknown
  ): Promise<TestResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.parseResponse<T>(response);
  }

  private async parseResponse<T>(response: Response): Promise<TestResponse<T>> {
    const contentType = response.headers.get('content-type');
    let data: T | undefined;

    if (contentType?.includes('application/json')) {
      data = (await response.json()) as T;
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
 * Create a test client instance
 */
export function createTestClient(baseUrl = DEFAULT_BASE_URL): TestClient {
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
  baseUrl = DEFAULT_BASE_URL,
  timeout = 10000
): Promise<void> {
  const client = createTestClient(baseUrl);
  await waitFor(
    async () => {
      try {
        const response = await client.get('/api/health');
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
export function uniqueId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Sleep helper
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Test Data Factories
// ============================================================================

/**
 * Create a test feedback item
 */
export function createTestFeedback(
  overrides: Partial<{
    projectId: string;
    title: string;
    description: string;
    type: string;
    status: string;
    priority: string;
    tags: string[];
    environment: Record<string, unknown>;
  }> = {}
): {
  projectId: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  tags: string[];
  environment: Record<string, unknown>;
} {
  const id = uniqueId('fb');
  return {
    projectId: overrides.projectId || uniqueId('project'),
    title: overrides.title || `Test Feedback ${id}`,
    description: overrides.description || `Description for ${id}`,
    type: overrides.type || 'bug',
    status: overrides.status || 'pending',
    priority: overrides.priority || 'medium',
    tags: overrides.tags || ['test'],
    environment: overrides.environment || {
      userAgent: 'TestClient/1.0',
      url: 'http://localhost/test',
      viewport: { width: 1920, height: 1080 },
    },
  };
}

/**
 * Create a batch of test feedback items
 */
export function createTestFeedbackBatch(
  count: number,
  projectId?: string
): ReturnType<typeof createTestFeedback>[] {
  const sharedProjectId = projectId || uniqueId('project');
  return Array.from({ length: count }, (_, i) =>
    createTestFeedback({
      projectId: sharedProjectId,
      title: `Test Feedback ${i + 1}`,
      description: `Description for feedback ${i + 1}`,
    })
  );
}
