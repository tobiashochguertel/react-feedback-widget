/**
 * Test Setup for feedback-server-cli
 *
 * This file runs before all tests to set up the test environment.
 */

import { afterEach, beforeEach, vi } from 'vitest';

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
  // CLI test server URL (integration tests)
  FEEDBACK_SERVER_URL: 'http://localhost:3001',
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
    serverUrl: 'http://localhost:3001',
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
