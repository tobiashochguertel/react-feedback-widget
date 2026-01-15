/**
 * Date Utility Functions
 *
 * Pure functions for date formatting and manipulation.
 *
 * @packageDocumentation
 */

/**
 * Format a date string as a relative date (e.g., "Today", "Yesterday", "3d ago")
 *
 * @param dateString - ISO date string to format
 * @returns Formatted relative date string or empty string if invalid
 *
 * @example
 * ```typescript
 * formatRelativeDate(new Date().toISOString()); // "Today"
 * formatRelativeDate(new Date(Date.now() - 86400000).toISOString()); // "Yesterday"
 * formatRelativeDate(new Date(Date.now() - 86400000 * 3).toISOString()); // "3d ago"
 * ```
 */
export function formatRelativeDate(dateString: string | undefined): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format a timestamp as a localized date/time string
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date/time string
 *
 * @example
 * ```typescript
 * formatTimestamp(Date.now()); // "1/15/2025, 2:30:45 PM"
 * ```
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Format a duration in milliseconds as a human-readable string
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string (e.g., "1m 30s", "45s", "2h 15m")
 *
 * @example
 * ```typescript
 * formatDuration(90000); // "1m 30s"
 * formatDuration(45000); // "45s"
 * formatDuration(8100000); // "2h 15m"
 * ```
 */
export function formatDuration(ms: number): string {
  if (ms < 0) return '0s';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  return `${seconds}s`;
}

/**
 * Check if a date string represents a date in the past
 *
 * @param dateString - ISO date string to check
 * @returns true if the date is in the past
 */
export function isInPast(dateString: string): boolean {
  const date = new Date(dateString);
  return date.getTime() < Date.now();
}

/**
 * Get the start of day for a given date
 *
 * @param date - Date to get start of day for
 * @returns New Date object set to start of day (00:00:00.000)
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}
