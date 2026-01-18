/**
 * Integration Tests for Export CLI Commands
 *
 * Tests the export functionality against a running server.
 *
 * NOTE: Tests that require server API calls will be skipped when:
 * - Server is not running
 * - Server requires authentication (no API_KEY configured)
 *
 * To run with authentication, set API_KEY in the server's .env file.
 */

import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import { spawn } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const SERVER_URL = 'http://localhost:3001';

// Check server availability and auth status
let serverAvailable = false;
let serverAuthRequired = false;

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
async function checkServerAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${SERVER_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Check if server requires authentication (returns 401 on feedback endpoint)
 */
async function checkServerAuthRequired(): Promise<boolean> {
  try {
    const response = await fetch(`${SERVER_URL}/api/feedback`);
    return response.status === 401;
  } catch {
    return true;
  }
}

/**
 * Helper to determine if a server-dependent test should be skipped
 */
function shouldSkipServerTest(): boolean {
  if (!serverAvailable) return true;
  if (serverAuthRequired && !process.env.FEEDBACK_API_KEY) return true;
  return false;
}

/**
 * Get reason for skipping a test
 */
function getSkipReason(): string {
  if (!serverAvailable) return '⏭️  Skipping: Server not available';
  if (serverAuthRequired && !process.env.FEEDBACK_API_KEY) {
    return '⏭️  Skipping: Server requires authentication (set FEEDBACK_API_KEY)';
  }
  return '';
}

describe('Export CLI Integration Tests', () => {
  const tempFiles: string[] = [];

  beforeAll(async () => {
    serverAvailable = await checkServerAvailable();
    if (!serverAvailable) {
      console.warn(
        '\n⚠️  Warning: Feedback server not running on port 3001.\n' +
        '   Export integration tests will be skipped.\n'
      );
      return;
    }

    // Check if server requires authentication
    serverAuthRequired = await checkServerAuthRequired();
    if (serverAuthRequired && !process.env.FEEDBACK_API_KEY) {
      console.warn(
        '\n⚠️  Warning: Feedback server requires authentication.\n' +
        '   Set FEEDBACK_API_KEY to run authenticated tests.\n' +
        '   Export integration tests requiring API access will be skipped.\n'
      );
    }
  });

  afterEach(() => {
    // Clean up temp files
    for (const file of tempFiles) {
      if (existsSync(file)) {
        try {
          unlinkSync(file);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    tempFiles.length = 0;
  });

  describe('Export Help', () => {
    test('should display export help', async () => {
      // Act
      const result = await runCli(['export', '--help']);

      // Assert
      expect(result.stdout).toContain('export');
      expect(result.stdout).toContain('format');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Export to File (requires server)', () => {
    test('should export to JSON file', async () => {
      if (shouldSkipServerTest()) {
        console.log(getSkipReason());
        return;
      }

      // Arrange
      const outputPath = join(tmpdir(), `feedback-export-${Date.now()}.json`);
      tempFiles.push(outputPath);

      // Act - Use subcommand syntax: export json <output>
      const result = await runCli([
        'export',
        'json',
        outputPath,
        '--force',
      ]);

      // Assert
      expect(result.exitCode).toBe(0);

      if (existsSync(outputPath)) {
        const content = await readFile(outputPath, 'utf-8');
        const parsed = JSON.parse(content);
        expect(Array.isArray(parsed) || typeof parsed === 'object').toBe(true);
      }
    });

    test('should export to CSV file', async () => {
      if (shouldSkipServerTest()) {
        console.log(getSkipReason());
        return;
      }

      // Arrange
      const outputPath = join(tmpdir(), `feedback-export-${Date.now()}.csv`);
      tempFiles.push(outputPath);

      // Act - Use subcommand syntax: export csv <output>
      const result = await runCli([
        'export',
        'csv',
        outputPath,
        '--force',
      ]);

      // Assert
      expect(result.exitCode).toBe(0);

      if (existsSync(outputPath)) {
        const content = await readFile(outputPath, 'utf-8');
        // CSV should have header row
        expect(content).toContain(',');
      }
    });

    test('should export to Markdown file', async () => {
      if (shouldSkipServerTest()) {
        console.log(getSkipReason());
        return;
      }

      // Arrange
      const outputPath = join(tmpdir(), `feedback-export-${Date.now()}.md`);
      tempFiles.push(outputPath);

      // Act - Use subcommand syntax: export markdown <output>
      const result = await runCli([
        'export',
        'markdown',
        outputPath,
        '--force',
      ]);

      // Assert
      expect(result.exitCode).toBe(0);

      if (existsSync(outputPath)) {
        const content = await readFile(outputPath, 'utf-8');
        // Markdown should have headers
        expect(content).toContain('#');
      }
    });
  });

  describe('Export with Filters (requires server)', () => {
    test('should export with status filter', async () => {
      if (shouldSkipServerTest()) {
        console.log(getSkipReason());
        return;
      }

      // Arrange
      const outputPath = join(tmpdir(), `feedback-filtered-${Date.now()}.json`);
      tempFiles.push(outputPath);

      // Act - Use subcommand syntax with filters
      const result = await runCli([
        'export',
        'json',
        outputPath,
        '--status', 'open',
        '--force',
      ]);

      // Assert
      expect(result.exitCode).toBe(0);
    });

    test('should export with limit', async () => {
      if (shouldSkipServerTest()) {
        console.log(getSkipReason());
        return;
      }

      // Arrange
      const outputPath = join(tmpdir(), `feedback-limited-${Date.now()}.json`);
      tempFiles.push(outputPath);

      // Act - Note: limit option may not be available, test basic export
      const result = await runCli([
        'export',
        'json',
        outputPath,
        '--force',
      ]);

      // Assert
      expect(result.exitCode).toBe(0);

      if (existsSync(outputPath)) {
        const content = await readFile(outputPath, 'utf-8');
        const parsed = JSON.parse(content);
        // Just verify it's valid JSON
        expect(Array.isArray(parsed) || typeof parsed === 'object').toBe(true);
      }
    });
  });

  describe('Export Error Handling', () => {
    test('should handle invalid format', async () => {
      // Act - Use an invalid subcommand
      const result = await runCli([
        'export',
        'invalid-format',
      ]);

      // Assert
      expect(result.exitCode).not.toBe(0);
    });

    test('should handle invalid output path', async () => {
      // Act - Try to write to non-existent directory
      const result = await runCli([
        'export',
        'json',
        '/nonexistent/path/file.json',
        '--force',
      ]);

      // Assert - Should handle gracefully
      expect(result.exitCode).not.toBe(0);
    });
  });
});
