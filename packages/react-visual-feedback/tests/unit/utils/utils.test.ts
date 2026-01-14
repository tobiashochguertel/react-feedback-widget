/**
 * Unit tests for utility functions.
 *
 * Tests core utility functions used throughout the library.
 */

import { describe, it, expect } from 'vitest';
import {
  generateId,
  formatTimestamp,
  formatFileSize,
  formatPath,
} from '../../../src/utils';

describe('generateId', () => {
  it('generates a unique ID', () => {
    const id1 = generateId();
    const id2 = generateId();

    expect(id1).toBeDefined();
    expect(typeof id1).toBe('string');
    expect(id1.length).toBeGreaterThan(0);
    expect(id1).not.toBe(id2);
  });

  it('generates IDs with consistent format', () => {
    const id = generateId();
    // Format: timestamp-randomstring (e.g., "1234567890-abc123def")
    expect(id).toMatch(/^\d+-[a-z0-9]+$/);
  });
});

describe('formatTimestamp', () => {
  it('formats timestamp correctly', () => {
    const timestamp = Date.now();
    const formatted = formatTimestamp(timestamp);

    expect(formatted).toBeDefined();
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
  });

  it('returns locale string format', () => {
    // Fixed timestamp for predictable output
    const timestamp = new Date('2025-01-15T10:30:00Z').getTime();
    const formatted = formatTimestamp(timestamp);

    // Should contain date parts (locale-dependent)
    expect(formatted).toMatch(/\d/);
  });
});

describe('formatFileSize', () => {
  it('formats zero bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('formats bytes correctly', () => {
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('formats kilobytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('formats megabytes correctly', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });

  it('formats gigabytes correctly', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });
});

describe('formatPath', () => {
  it('returns Unknown for null or undefined', () => {
    expect(formatPath(null)).toBe('Unknown');
    expect(formatPath(undefined)).toBe('Unknown');
  });

  it('extracts src path from full path', () => {
    const path = '/Users/dev/project/src/components/Button.tsx';
    expect(formatPath(path)).toBe('src/components/Button.tsx');
  });

  it('extracts components path from full path', () => {
    const path = '/project/components/Button.tsx';
    expect(formatPath(path)).toBe('components/Button.tsx');
  });

  it('truncates long paths without src or components', () => {
    const path = '/very/long/path/to/some/file.tsx';
    const formatted = formatPath(path);
    expect(formatted).toBe('.../to/some/file.tsx');
  });

  it('returns short paths as-is', () => {
    const path = 'short/path.ts';
    expect(formatPath(path)).toBe('short/path.ts');
  });
});
