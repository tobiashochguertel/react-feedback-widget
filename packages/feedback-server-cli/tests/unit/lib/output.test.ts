/**
 * Unit Tests for Output Formatters
 *
 * Tests the formatOutput function with different output formats.
 */

import { describe, test, expect } from 'vitest';
import { formatOutput } from '../../../src/lib/output.js';

describe('formatOutput', () => {
  describe('json format', () => {
    test('should format object as JSON with indentation', () => {
      // Arrange
      const data = { id: '1', name: 'Test' };

      // Act
      const result = formatOutput(data, 'json');

      // Assert
      expect(result).toBe(JSON.stringify(data, null, 2));
      expect(result).toContain('"id": "1"');
      expect(result).toContain('"name": "Test"');
    });

    test('should format array as JSON', () => {
      // Arrange
      const data = [{ id: '1' }, { id: '2' }];

      // Act
      const result = formatOutput(data, 'json');

      // Assert
      expect(result).toContain('"id": "1"');
      expect(result).toContain('"id": "2"');
    });

    test('should handle null values', () => {
      // Arrange
      const data = { id: '1', description: null };

      // Act
      const result = formatOutput(data, 'json');

      // Assert
      expect(result).toContain('"description": null');
    });

    test('should handle nested objects', () => {
      // Arrange
      const data = {
        id: '1',
        environment: {
          url: 'https://example.com',
          userAgent: 'Test Browser',
        },
      };

      // Act
      const result = formatOutput(data, 'json');

      // Assert
      expect(result).toContain('"environment":');
      expect(result).toContain('"url": "https://example.com"');
    });
  });

  describe('yaml format', () => {
    test('should format object as YAML', () => {
      // Arrange
      const data = { id: '1', name: 'Test' };

      // Act
      const result = formatOutput(data, 'yaml');

      // Assert
      expect(result).toContain('id:');
      expect(result).toContain('name: Test');
    });

    test('should format array as YAML', () => {
      // Arrange
      const data = [{ id: '1' }, { id: '2' }];

      // Act
      const result = formatOutput(data, 'yaml');

      // Assert
      expect(result).toContain('- id:');
    });

    test('should handle nested objects in YAML', () => {
      // Arrange
      const data = {
        id: '1',
        environment: {
          url: 'https://example.com',
        },
      };

      // Act
      const result = formatOutput(data, 'yaml');

      // Assert
      expect(result).toContain('environment:');
      expect(result).toContain('url: https://example.com');
    });
  });

  describe('table format (default)', () => {
    test('should return JSON for table format (caller handles table construction)', () => {
      // Arrange
      const data = { id: '1', name: 'Test' };

      // Act
      const result = formatOutput(data, 'table');

      // Assert
      // Table format falls back to JSON (caller handles table construction)
      expect(result).toBe(JSON.stringify(data, null, 2));
    });
  });

  describe('unknown format', () => {
    test('should return JSON for unknown format', () => {
      // Arrange
      const data = { id: '1', name: 'Test' };

      // Act
      const result = formatOutput(data, 'unknown');

      // Assert
      expect(result).toBe(JSON.stringify(data, null, 2));
    });
  });
});
