/**
 * Date Utilities Tests
 *
 * Unit tests for date formatting and manipulation functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatRelativeDate,
  formatTimestamp,
  formatDuration,
  formatTime,
  formatDate,
  formatShortDate,
  isInPast,
  startOfDay,
} from '../../../src/utils/dateUtils';

describe('dateUtils', () => {
  describe('formatRelativeDate', () => {
    beforeEach(() => {
      // Fix the current date to 2025-01-15T12:00:00Z
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return empty string for undefined', () => {
      expect(formatRelativeDate(undefined)).toBe('');
    });

    it('should return empty string for invalid date', () => {
      expect(formatRelativeDate('not-a-date')).toBe('');
    });

    it('should return "Today" for same day', () => {
      expect(formatRelativeDate('2025-01-15T10:00:00Z')).toBe('Today');
    });

    it('should return "Yesterday" for previous day', () => {
      expect(formatRelativeDate('2025-01-14T10:00:00Z')).toBe('Yesterday');
    });

    it('should return "Xd ago" for 2-6 days', () => {
      expect(formatRelativeDate('2025-01-13T10:00:00Z')).toBe('2d ago');
      expect(formatRelativeDate('2025-01-12T10:00:00Z')).toBe('3d ago');
      expect(formatRelativeDate('2025-01-10T10:00:00Z')).toBe('5d ago');
      expect(formatRelativeDate('2025-01-09T10:00:00Z')).toBe('6d ago');
    });

    it('should return formatted date for 7+ days', () => {
      expect(formatRelativeDate('2025-01-08T10:00:00Z')).toBe('Jan 8');
      expect(formatRelativeDate('2024-12-15T10:00:00Z')).toBe('Dec 15');
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp as locale string', () => {
      const timestamp = new Date('2025-01-15T10:30:45Z').getTime();
      const result = formatTimestamp(timestamp);

      // The format varies by locale, but should contain date and time
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('formatDuration', () => {
    it('should return "0s" for negative values', () => {
      expect(formatDuration(-1000)).toBe('0s');
    });

    it('should format seconds only', () => {
      expect(formatDuration(0)).toBe('0s');
      expect(formatDuration(1000)).toBe('1s');
      expect(formatDuration(45000)).toBe('45s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(60000)).toBe('1m');
      expect(formatDuration(90000)).toBe('1m 30s');
      expect(formatDuration(120000)).toBe('2m');
      expect(formatDuration(125000)).toBe('2m 5s');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(3600000)).toBe('1h');
      expect(formatDuration(3660000)).toBe('1h 1m');
      expect(formatDuration(5400000)).toBe('1h 30m');
      expect(formatDuration(8100000)).toBe('2h 15m');
    });
  });

  describe('formatTime', () => {
    it('should return "00:00" for negative values', () => {
      expect(formatTime(-1)).toBe('00:00');
    });

    it('should format seconds to MM:SS', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(5)).toBe('00:05');
      expect(formatTime(30)).toBe('00:30');
      expect(formatTime(59)).toBe('00:59');
    });

    it('should format minutes to MM:SS', () => {
      expect(formatTime(60)).toBe('01:00');
      expect(formatTime(90)).toBe('01:30');
      expect(formatTime(125)).toBe('02:05');
      expect(formatTime(3599)).toBe('59:59');
    });

    it('should format hours to H:MM:SS', () => {
      expect(formatTime(3600)).toBe('1:00:00');
      expect(formatTime(3661)).toBe('1:01:01');
      expect(formatTime(3723)).toBe('1:02:03');
      expect(formatTime(7265)).toBe('2:01:05');
    });
  });

  describe('formatDate', () => {
    it('should return empty string for undefined', () => {
      expect(formatDate(undefined)).toBe('');
    });

    it('should return empty string for invalid date', () => {
      expect(formatDate('not-a-date')).toBe('');
    });

    it('should format date with month, day, and year', () => {
      expect(formatDate('2025-01-15T10:00:00Z')).toBe('Jan 15, 2025');
      expect(formatDate('2024-12-25T00:00:00Z')).toBe('Dec 25, 2024');
    });
  });

  describe('formatShortDate', () => {
    it('should return empty string for undefined', () => {
      expect(formatShortDate(undefined)).toBe('');
    });

    it('should return empty string for invalid date', () => {
      expect(formatShortDate('not-a-date')).toBe('');
    });

    it('should format date with month and day only', () => {
      expect(formatShortDate('2025-01-15T10:00:00Z')).toBe('Jan 15');
      expect(formatShortDate('2024-12-25T00:00:00Z')).toBe('Dec 25');
    });
  });

  describe('isInPast', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true for past dates', () => {
      expect(isInPast('2025-01-14T12:00:00Z')).toBe(true);
      expect(isInPast('2024-12-31T23:59:59Z')).toBe(true);
    });

    it('should return false for future dates', () => {
      expect(isInPast('2025-01-16T12:00:00Z')).toBe(false);
      expect(isInPast('2025-12-31T00:00:00Z')).toBe(false);
    });
  });

  describe('startOfDay', () => {
    it('should set time to 00:00:00.000', () => {
      const date = new Date('2025-01-15T14:30:45.123Z');
      const result = startOfDay(date);

      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should preserve the date', () => {
      const date = new Date('2025-01-15T14:30:45.123Z');
      const result = startOfDay(date);

      expect(result.getFullYear()).toBe(date.getFullYear());
      expect(result.getMonth()).toBe(date.getMonth());
      expect(result.getDate()).toBe(date.getDate());
    });

    it('should not mutate the original date', () => {
      const date = new Date('2025-01-15T14:30:45.123Z');
      const originalTime = date.getTime();

      startOfDay(date);

      expect(date.getTime()).toBe(originalTime);
    });
  });
});
