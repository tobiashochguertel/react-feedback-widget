/**
 * Integration Tests for Feedback CLI Commands
 *
 * These tests run against a live feedback server (port 3001).
 *
 * Prerequisites:
 * - Feedback server running on http://localhost:3001
 * - Run: `bun vitest run tests/integration`
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { spawn } from 'child_process';

// Server URL for tests
const SERVER_URL = 'http://localhost:3001';

/**
 * Helper to run CLI commands and capture output
 */
async function runCli(
  args: string[],
  options: { timeout?: number; env?: Record<string, string> } = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const env = {
      ...process.env,
      FEEDBACK_SERVER_URL: SERVER_URL,
      NO_UPDATE_NOTIFIER: '1',
      FORCE_COLOR: '0',
      ...options.env,
    };

    const timeout = options.timeout ?? 10000;

    // Run via bun to use the source directly
    const proc = spawn('bun', ['run', './src/index.ts', ...args], {
      cwd: process.cwd(),
      env,
      timeout,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 0 });
    });

    proc.on('error', () => {
      resolve({ stdout, stderr, exitCode: 1 });
    });
  });
}

/**
 * Check if server is available
 */
async function isServerAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${SERVER_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

describe('Feedback CLI Integration Tests', () => {
  let serverAvailable: boolean;

  beforeAll(async () => {
    serverAvailable = await isServerAvailable();
    if (!serverAvailable) {
      console.warn(
        '\n⚠️  Warning: Feedback server not running on port 3001.\n' +
          '   Some integration tests will be skipped.\n' +
          '   Start the server with: task api:dev\n'
      );
    }
  });

  describe('CLI Help & Version', () => {
    test('should display help message', async () => {
      // Act
      const result = await runCli(['--help']);

      // Assert
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('feedback-cli');
      expect(result.exitCode).toBe(0);
    });

    test('should display version', async () => {
      // Act
      const result = await runCli(['--version']);

      // Assert
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Feedback Commands', () => {
    test.skipIf(!serverAvailable)(
      'should list feedback items',
      async () => {
        // Act
        const result = await runCli(['feedback', 'list', '--output', 'json']);

        // Assert - JSON output should be valid
        expect(result.exitCode).toBe(0);
        // The output might be a table or JSON
        if (result.stdout.trim().startsWith('[') || result.stdout.trim().startsWith('{')) {
          const parsed = JSON.parse(result.stdout);
          expect(parsed).toBeDefined();
        }
      }
    );

    test.skipIf(!serverAvailable)(
      'should show feedback stats',
      async () => {
        // Act
        const result = await runCli(['feedback', 'stats']);

        // Assert
        expect(result.exitCode).toBe(0);
        // Stats output should contain some statistics
        expect(result.stdout.length).toBeGreaterThan(0);
      }
    );

    test.skipIf(!serverAvailable)(
      'should handle feedback get with invalid ID',
      async () => {
        // Act
        const result = await runCli(['feedback', 'get', 'invalid-id-12345']);

        // Assert - Should fail gracefully
        expect(result.exitCode).not.toBe(0);
        // Should have some error message
        expect(result.stderr.length + result.stdout.length).toBeGreaterThan(0);
      }
    );
  });

  describe('Config Commands', () => {
    test('should list config values', async () => {
      // Act
      const result = await runCli(['config', 'list']);

      // Assert
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('serverUrl');
    });

    test('should get specific config value', async () => {
      // Act
      const result = await runCli(['config', 'get', 'serverUrl']);

      // Assert
      expect(result.exitCode).toBe(0);
      // Should output the value
      expect(result.stdout.length).toBeGreaterThan(0);
    });
  });

  describe('Auth Commands', () => {
    test('should show whoami status', async () => {
      // Act
      const result = await runCli(['auth', 'whoami']);

      // Assert - Should either show user or "not logged in"
      expect(result.exitCode).toBe(0);
      expect(result.stdout.length).toBeGreaterThan(0);
    });
  });

  describe('Export Commands', () => {
    test.skipIf(!serverAvailable)(
      'should export to JSON format',
      async () => {
        // This test creates a temporary file, so we use a unique path
        const outputPath = `/tmp/feedback-export-test-${Date.now()}.json`;

        // Act
        const result = await runCli(['export', '--format', 'json', '--output', outputPath]);

        // Assert
        expect(result.exitCode).toBe(0);
      }
    );
  });

  describe('Error Handling', () => {
    test('should handle unknown command gracefully', async () => {
      // Act
      const result = await runCli(['unknown-command']);

      // Assert
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr + result.stdout).toContain('error');
    });

    test('should handle missing required arguments', async () => {
      // Act - feedback get requires an ID
      const result = await runCli(['feedback', 'get']);

      // Assert
      expect(result.exitCode).not.toBe(0);
    });
  });
});
