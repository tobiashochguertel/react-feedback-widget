/**
 * Unit Tests for Logger Utility
 *
 * Tests the logger with different log levels.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// We need to test the logger's behavior, not the module itself
// The logger uses console.log/error directly, so we capture the output

describe('Logger', () => {
  let logs: string[] = [];
  let errors: string[] = [];
  let originalLog: typeof console.log;
  let originalError: typeof console.error;

  beforeEach(async () => {
    // Capture original console methods
    originalLog = console.log;
    originalError = console.error;
    logs = [];
    errors = [];

    // Override console methods
    console.log = (...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    };
    console.error = (...args: unknown[]) => {
      errors.push(args.map(String).join(' '));
    };
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalLog;
    console.error = originalError;
    // Clear module cache to reset logger state
    vi.resetModules();
  });

  describe('log levels', () => {
    test('should log info messages at info level', async () => {
      // Arrange - Import fresh logger
      const { logger } = await import('../../../src/utils/logger.js');
      logger.setLevel('info');

      // Act
      logger.info('Test info message');

      // Assert
      expect(logs.length).toBe(1);
      expect(logs[0]).toContain('Test info message');
    });

    test('should not log debug messages at info level', async () => {
      // Arrange
      const { logger } = await import('../../../src/utils/logger.js');
      logger.setLevel('info');

      // Act
      logger.debug('Test debug message');

      // Assert
      expect(logs.length).toBe(0);
    });

    test('should log debug messages at debug level', async () => {
      // Arrange
      const { logger } = await import('../../../src/utils/logger.js');
      logger.setLevel('debug');

      // Act
      logger.debug('Test debug message');

      // Assert
      expect(logs.length).toBe(1);
      expect(logs[0]).toContain('Test debug message');
    });

    test('should log warn messages at info level', async () => {
      // Arrange
      const { logger } = await import('../../../src/utils/logger.js');
      logger.setLevel('info');

      // Act
      logger.warn('Test warn message');

      // Assert
      expect(logs.length).toBe(1);
      expect(logs[0]).toContain('Test warn message');
    });

    test('should log error messages to console.error', async () => {
      // Arrange
      const { logger } = await import('../../../src/utils/logger.js');
      logger.setLevel('info');

      // Act
      logger.error('Test error message');

      // Assert
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('Test error message');
    });

    test('should not log info at error level', async () => {
      // Arrange
      const { logger } = await import('../../../src/utils/logger.js');
      logger.setLevel('error');

      // Act
      logger.info('Test info message');

      // Assert
      expect(logs.length).toBe(0);
    });

    test('should not log warn at error level', async () => {
      // Arrange
      const { logger } = await import('../../../src/utils/logger.js');
      logger.setLevel('error');

      // Act
      logger.warn('Test warn message');

      // Assert
      expect(logs.length).toBe(0);
    });
  });

  describe('success', () => {
    test('should always log success messages', async () => {
      // Arrange
      const { logger } = await import('../../../src/utils/logger.js');
      logger.setLevel('error'); // Even at highest level

      // Act
      logger.success('Test success message');

      // Assert
      expect(logs.length).toBe(1);
      expect(logs[0]).toContain('Test success message');
    });
  });

  describe('message formatting', () => {
    test('should include DEBUG prefix for debug messages', async () => {
      // Arrange
      const { logger } = await import('../../../src/utils/logger.js');
      logger.setLevel('debug');

      // Act
      logger.debug('Test message');

      // Assert
      expect(logs[0]).toContain('[DEBUG]');
    });

    test('should include info icon for info messages', async () => {
      // Arrange
      const { logger } = await import('../../../src/utils/logger.js');
      logger.setLevel('info');

      // Act
      logger.info('Test message');

      // Assert
      expect(logs[0]).toContain('ℹ');
    });

    test('should include warning icon for warn messages', async () => {
      // Arrange
      const { logger } = await import('../../../src/utils/logger.js');
      logger.setLevel('info');

      // Act
      logger.warn('Test message');

      // Assert
      expect(logs[0]).toContain('⚠');
    });

    test('should include error icon for error messages', async () => {
      // Arrange
      const { logger } = await import('../../../src/utils/logger.js');
      logger.setLevel('info');

      // Act
      logger.error('Test message');

      // Assert
      expect(errors[0]).toContain('✖');
    });

    test('should include success icon for success messages', async () => {
      // Arrange
      const { logger } = await import('../../../src/utils/logger.js');
      logger.setLevel('info');

      // Act
      logger.success('Test message');

      // Assert
      expect(logs[0]).toContain('✓');
    });
  });
});
