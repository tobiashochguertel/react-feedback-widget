/**
 * Integration Tests for Export CLI Commands
 *
 * Tests the export functionality against a running server.
 */

import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import { spawn } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const SERVER_URL = 'http://localhost:3001';

// Check server availability synchronously before tests
let serverAvailable = false;

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

describe('Export CLI Integration Tests', () => {
  const tempFiles: string[] = [];

  beforeAll(async () => {
    serverAvailable = await checkServerAvailable();
    if (!serverAvailable) {
      console.warn(
        '\n⚠️  Warning: Feedback server not running on port 3001.\n' +
        '   Export integration tests will be skipped.\n'
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
      if (!serverAvailable) {
        console.log('⏭️  Skipping: Server not available');
        return;
      }

      // Arrange
      const outputPath = join(tmpdir(), `feedback-export-${Date.now()}.json`);
      tempFiles.push(outputPath);

      // Act
      const result = await runCli([
        'export',
        '--format', 'json',
        '--output', outputPath,
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
      if (!serverAvailable) {
        console.log('⏭️  Skipping: Server not available');
        return;
      }

      // Arrange
      const outputPath = join(tmpdir(), `feedback-export-${Date.now()}.csv`);
      tempFiles.push(outputPath);

      // Act
      const result = await runCli([
        'export',
        '--format', 'csv',
        '--output', outputPath,
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
      if (!serverAvailable) {
        console.log('⏭️  Skipping: Server not available');
        return;
      }

      // Arrange
      const outputPath = join(tmpdir(), `feedback-export-${Date.now()}.md`);
      tempFiles.push(outputPath);

      // Act
      const result = await runCli([
        'export',
        '--format', 'markdown',
        '--output', outputPath,
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
      if (!serverAvailable) {
        console.log('⏭️  Skipping: Server not available');
        return;
      }

      // Arrange
      const outputPath = join(tmpdir(), `feedback-filtered-${Date.now()}.json`);
      tempFiles.push(outputPath);

      // Act
      const result = await runCli([
        'export',
        '--format', 'json',
        '--status', 'open',
        '--output', outputPath,
      ]);

      // Assert
      expect(result.exitCode).toBe(0);
    });

    test('should export with limit', async () => {
      if (!serverAvailable) {
        console.log('⏭️  Skipping: Server not available');
        return;
      }

      // Arrange
      const outputPath = join(tmpdir(), `feedback-limited-${Date.now()}.json`);
      tempFiles.push(outputPath);

      // Act
      const result = await runCli([
        'export',
        '--format', 'json',
        '--limit', '5',
        '--output', outputPath,
      ]);

      // Assert
      expect(result.exitCode).toBe(0);

      if (existsSync(outputPath)) {
        const content = await readFile(outputPath, 'utf-8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          expect(parsed.length).toBeLessThanOrEqual(5);
        }
      }
    });
  });

  describe('Export Error Handling', () => {
    test('should handle invalid format', async () => {
      // Act
      const result = await runCli([
        'export',
        '--format', 'invalid-format',
      ]);

      // Assert
      expect(result.exitCode).not.toBe(0);
    });

    test('should handle invalid output path', async () => {
      // Act
      const result = await runCli([
        'export',
        '--format', 'json',
        '--output', '/nonexistent/path/file.json',
      ]);

      // Assert - Should handle gracefully
      expect(result.exitCode).not.toBe(0);
    });
  });
});
