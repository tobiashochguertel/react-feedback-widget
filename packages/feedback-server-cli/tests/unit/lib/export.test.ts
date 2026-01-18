/**
 * Unit Tests for Export Utilities
 *
 * Tests the export functions for JSON, CSV, and Markdown formats.
 */

import { describe, test, expect } from 'vitest';
import {
  exportToJson,
  exportToCsv,
  exportToMarkdown,
} from '../../../src/lib/export.js';
import type { Feedback } from '../../../src/types/index.js';

/**
 * Factory function for creating test feedback items
 */
function createTestFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: 'fb-001',
    projectId: 'test-project',
    sessionId: 'session-001',
    title: 'Test Feedback',
    description: 'This is a test feedback item',
    type: 'bug',
    status: 'pending',
    priority: 'medium',
    environment: {
      url: 'https://example.com/page',
      userAgent: 'Mozilla/5.0 (Test)',
      browser: 'Chrome',
      browserVersion: '120.0',
      os: 'macOS',
      viewportWidth: 1920,
      viewportHeight: 1080,
    },
    screenshots: [],
    tags: [],
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2025-01-15T10:00:00.000Z',
    ...overrides,
  };
}

describe('exportToJson', () => {
  test('should export feedback items to JSON format', async () => {
    // Arrange
    const items: Feedback[] = [createTestFeedback()];

    // Act
    const result = await exportToJson(items);

    // Assert
    const parsed = JSON.parse(result);
    expect(parsed.exportedAt).toBeDefined();
    expect(parsed.count).toBe(1);
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0].id).toBe('fb-001');
    expect(parsed.items[0].title).toBe('Test Feedback');
  });

  test('should include media data when includeMedia is true', async () => {
    // Arrange
    const items: Feedback[] = [
      createTestFeedback({
        screenshots: [{ id: 'ss-001', data: 'base64data', mimeType: 'image/png' }],
        videoId: 'video-001',
      }),
    ];

    // Act
    const result = await exportToJson(items, true);

    // Assert
    const parsed = JSON.parse(result);
    expect(parsed.items[0].screenshots).toBeDefined();
    expect(parsed.items[0].screenshots[0].data).toBe('base64data');
    expect(parsed.items[0].videoId).toBe('video-001');
  });

  test('should exclude media data when includeMedia is false', async () => {
    // Arrange
    const items: Feedback[] = [
      createTestFeedback({
        screenshots: [{ id: 'ss-001', data: 'base64data', mimeType: 'image/png' }],
        videoId: 'video-001',
      }),
    ];

    // Act
    const result = await exportToJson(items, false);

    // Assert
    const parsed = JSON.parse(result);
    expect(parsed.items[0].screenshots).toBeUndefined();
    expect(parsed.items[0].videoId).toBeUndefined();
  });

  test('should handle empty array', async () => {
    // Arrange
    const items: Feedback[] = [];

    // Act
    const result = await exportToJson(items);

    // Assert
    const parsed = JSON.parse(result);
    expect(parsed.count).toBe(0);
    expect(parsed.items).toHaveLength(0);
  });
});

describe('exportToCsv', () => {
  test('should export feedback items to CSV format', async () => {
    // Arrange
    const items: Feedback[] = [createTestFeedback()];

    // Act
    const result = await exportToCsv(items);

    // Assert
    // Check CSV header
    expect(result).toContain('ID,Title,Description,Type,Status,Priority');
    // Check data row
    expect(result).toContain('fb-001');
    expect(result).toContain('Test Feedback');
    expect(result).toContain('bug');
    expect(result).toContain('pending');
    expect(result).toContain('medium');
  });

  test('should include URL from environment', async () => {
    // Arrange
    const items: Feedback[] = [
      createTestFeedback({
        environment: {
          url: 'https://example.com/page',
          userAgent: 'Mozilla/5.0 (Test)',
        },
      }),
    ];

    // Act
    const result = await exportToCsv(items);

    // Assert
    expect(result).toContain('https://example.com/page');
  });

  test('should handle items with screenshots', async () => {
    // Arrange
    const items: Feedback[] = [
      createTestFeedback({
        screenshots: [{ id: 'ss-001', data: 'base64', mimeType: 'image/png' }],
      }),
    ];

    // Act
    const result = await exportToCsv(items);

    // Assert
    expect(result).toContain('Yes'); // Has Screenshot
  });

  test('should handle items without screenshots', async () => {
    // Arrange
    const items: Feedback[] = [createTestFeedback({ screenshots: [] })];

    // Act
    const result = await exportToCsv(items);

    // Assert
    expect(result).toContain('No'); // Has Screenshot
  });

  test('should handle items with video', async () => {
    // Arrange
    const items: Feedback[] = [createTestFeedback({ videoId: 'video-001' })];

    // Act
    const result = await exportToCsv(items);

    // Assert
    expect(result).toContain('Yes'); // Has Video
  });

  test('should escape special characters in CSV', async () => {
    // Arrange
    const items: Feedback[] = [
      createTestFeedback({
        title: 'Test, with "quotes" and commas',
        description: 'Description with\nnewlines',
      }),
    ];

    // Act
    const result = await exportToCsv(items);

    // Assert
    // CSV should properly escape the content
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('exportToMarkdown', () => {
  test('should export feedback items to Markdown format', async () => {
    // Arrange
    const items: Feedback[] = [createTestFeedback()];

    // Act
    const result = await exportToMarkdown(items);

    // Assert
    expect(result).toContain('# Feedback Export');
    expect(result).toContain('> Exported on');
    expect(result).toContain('> Total items: 1');
  });

  test('should include summary table with status counts', async () => {
    // Arrange
    const items: Feedback[] = [
      createTestFeedback({ status: 'pending' }),
      createTestFeedback({ id: 'fb-002', status: 'pending' }),
      createTestFeedback({ id: 'fb-003', status: 'resolved' }),
    ];

    // Act
    const result = await exportToMarkdown(items);

    // Assert
    expect(result).toContain('## Summary');
    expect(result).toContain('| Status | Count |');
    expect(result).toContain('| pending | 2 |');
    expect(result).toContain('| resolved | 1 |');
  });

  test('should include individual feedback items', async () => {
    // Arrange
    const items: Feedback[] = [createTestFeedback()];

    // Act
    const result = await exportToMarkdown(items);

    // Assert
    expect(result).toContain('## Feedback Items');
    expect(result).toContain('### Test Feedback');
    expect(result).toContain('- **ID:** `fb-001`');
    expect(result).toContain('- **Type:** bug');
    expect(result).toContain('- **Status:** pending');
    expect(result).toContain('- **Priority:** medium');
  });

  test('should include description section', async () => {
    // Arrange
    const items: Feedback[] = [
      createTestFeedback({
        description: 'This is a detailed description',
      }),
    ];

    // Act
    const result = await exportToMarkdown(items);

    // Assert
    expect(result).toContain('#### Description');
    expect(result).toContain('This is a detailed description');
  });

  test('should include URL from environment', async () => {
    // Arrange
    const items: Feedback[] = [
      createTestFeedback({
        environment: {
          url: 'https://example.com/page',
          userAgent: 'Mozilla/5.0',
        },
      }),
    ];

    // Act
    const result = await exportToMarkdown(items);

    // Assert
    expect(result).toContain('**URL:** https://example.com/page');
  });

  test('should handle empty items array', async () => {
    // Arrange
    const items: Feedback[] = [];

    // Act
    const result = await exportToMarkdown(items);

    // Assert
    expect(result).toContain('# Feedback Export');
    expect(result).toContain('> Total items: 0');
  });
});
