/**
 * Unit tests for utility functions.
 *
 * Tests core utility functions used throughout the library.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateId,
  formatDate,
  formatRelativeTime,
  formatFileSize,
  debounce,
  throttle,
  deepMerge,
  isValidEmail,
  sanitizeHtml,
  truncateText,
  safeJSONParse,
  safeJSONStringify,
  normalizeRect,
  isPointInRect,
} from '@/utils';

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
    // Most ID generators use alphanumeric characters
    expect(id).toMatch(/^[a-zA-Z0-9_-]+$/);
  });
});

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2025-01-15T10:30:00Z');
    const formatted = formatDate(date);

    expect(formatted).toBeDefined();
    expect(typeof formatted).toBe('string');
  });

  it('handles string input', () => {
    const formatted = formatDate('2025-01-15T10:30:00Z');
    expect(formatted).toBeDefined();
  });

  it('handles timestamp input', () => {
    const formatted = formatDate(1705315800000);
    expect(formatted).toBeDefined();
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats time as "just now" for recent times', () => {
    const date = new Date('2025-01-15T11:59:30Z');
    const result = formatRelativeTime(date);
    expect(result.toLowerCase()).toContain('just now');
  });

  it('formats minutes ago correctly', () => {
    const date = new Date('2025-01-15T11:55:00Z');
    const result = formatRelativeTime(date);
    expect(result).toMatch(/\d+ min(utes?)? ago/i);
  });

  it('formats hours ago correctly', () => {
    const date = new Date('2025-01-15T09:00:00Z');
    const result = formatRelativeTime(date);
    expect(result).toMatch(/\d+ hours? ago/i);
  });
});

describe('formatFileSize', () => {
  it('formats bytes correctly', () => {
    expect(formatFileSize(500)).toBe('500 B');
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

  it('handles zero', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays function execution', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('only calls once for rapid invocations', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes arguments to debounced function', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('arg1', 'arg2');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('limits function calls', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('deepMerge', () => {
  it('merges simple objects', () => {
    const result = deepMerge({ a: 1 }, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('merges nested objects', () => {
    const result = deepMerge(
      { a: { b: 1, c: 2 } },
      { a: { c: 3, d: 4 } }
    );
    expect(result).toEqual({ a: { b: 1, c: 3, d: 4 } });
  });

  it('overrides primitives', () => {
    const result = deepMerge({ a: 1 }, { a: 2 });
    expect(result).toEqual({ a: 2 });
  });

  it('handles arrays', () => {
    const result = deepMerge({ a: [1, 2] }, { a: [3, 4] });
    // Arrays are typically replaced, not merged
    expect(result.a).toEqual([3, 4]);
  });

  it('handles null and undefined', () => {
    const result = deepMerge({ a: 1 }, { a: null });
    expect(result.a).toBeNull();
  });
});

describe('isValidEmail', () => {
  it('validates correct email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    expect(isValidEmail('user+tag@example.org')).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('noat.com')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
  });
});

describe('sanitizeHtml', () => {
  it('removes script tags', () => {
    const input = 'Hello <script>alert("xss")</script> World';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('</script>');
  });

  it('removes event handlers', () => {
    const input = '<div onclick="alert()">Click me</div>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onclick');
  });

  it('preserves safe content', () => {
    const input = 'Hello World';
    const result = sanitizeHtml(input);
    expect(result).toBe('Hello World');
  });
});

describe('truncateText', () => {
  it('truncates long text', () => {
    const text = 'This is a very long text that should be truncated';
    const result = truncateText(text, 20);
    expect(result.length).toBeLessThanOrEqual(23); // 20 + '...'
    expect(result).toContain('...');
  });

  it('does not truncate short text', () => {
    const text = 'Short text';
    const result = truncateText(text, 20);
    expect(result).toBe('Short text');
  });

  it('handles empty string', () => {
    const result = truncateText('', 20);
    expect(result).toBe('');
  });
});

describe('safeJSONParse', () => {
  it('parses valid JSON', () => {
    const result = safeJSONParse('{"key": "value"}');
    expect(result).toEqual({ key: 'value' });
  });

  it('returns default for invalid JSON', () => {
    const result = safeJSONParse('not json', { default: true });
    expect(result).toEqual({ default: true });
  });

  it('returns null for invalid JSON with no default', () => {
    const result = safeJSONParse('not json');
    expect(result).toBeNull();
  });
});

describe('safeJSONStringify', () => {
  it('stringifies valid object', () => {
    const result = safeJSONStringify({ key: 'value' });
    expect(result).toBe('{"key":"value"}');
  });

  it('handles circular references gracefully', () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;

    const result = safeJSONStringify(obj);
    // Should not throw, returns some fallback
    expect(typeof result).toBe('string');
  });
});

describe('normalizeRect', () => {
  it('normalizes rectangle with negative dimensions', () => {
    const rect = { x: 100, y: 100, width: -50, height: -50 };
    const result = normalizeRect(rect);

    expect(result.x).toBe(50);
    expect(result.y).toBe(50);
    expect(result.width).toBe(50);
    expect(result.height).toBe(50);
  });

  it('keeps positive dimensions unchanged', () => {
    const rect = { x: 10, y: 20, width: 100, height: 50 };
    const result = normalizeRect(rect);

    expect(result).toEqual(rect);
  });
});

describe('isPointInRect', () => {
  const rect = { x: 10, y: 10, width: 100, height: 50 };

  it('returns true for point inside rectangle', () => {
    expect(isPointInRect({ x: 50, y: 30 }, rect)).toBe(true);
  });

  it('returns true for point on edge', () => {
    expect(isPointInRect({ x: 10, y: 10 }, rect)).toBe(true);
    expect(isPointInRect({ x: 110, y: 60 }, rect)).toBe(true);
  });

  it('returns false for point outside rectangle', () => {
    expect(isPointInRect({ x: 5, y: 30 }, rect)).toBe(false);
    expect(isPointInRect({ x: 115, y: 30 }, rect)).toBe(false);
    expect(isPointInRect({ x: 50, y: 5 }, rect)).toBe(false);
    expect(isPointInRect({ x: 50, y: 65 }, rect)).toBe(false);
  });
});
