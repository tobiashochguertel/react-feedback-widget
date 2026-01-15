/**
 * Validation Utility Functions
 *
 * Pure functions for input validation and sanitization.
 *
 * @packageDocumentation
 */

/**
 * Check if a value is a non-empty string
 *
 * @param value - Value to check
 * @returns true if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if a value is a valid email address
 *
 * @param email - Email address to validate
 * @returns true if email is valid
 */
export function isValidEmail(email: string): boolean {
  // Basic email regex - covers most common cases
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if a value is a valid URL
 *
 * @param url - URL to validate
 * @returns true if URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a blob is a valid video
 *
 * @param blob - Blob to check
 * @returns true if blob is a video type
 */
export function isValidVideoBlob(blob: Blob | null | undefined): blob is Blob {
  if (!blob) return false;
  return blob.type.startsWith('video/');
}

/**
 * Check if a blob is within size limits
 *
 * @param blob - Blob to check
 * @param maxSizeBytes - Maximum size in bytes
 * @returns true if blob is within limits
 */
export function isBlobWithinSizeLimit(
  blob: Blob | null | undefined,
  maxSizeBytes: number
): boolean {
  if (!blob) return false;
  return blob.size <= maxSizeBytes;
}

/**
 * Sanitize a string for safe display (escape HTML)
 *
 * @param input - String to sanitize
 * @returns Sanitized string with HTML entities escaped
 */
export function sanitizeString(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Validate feedback data has required fields
 *
 * @param data - Feedback data to validate
 * @returns Object with isValid flag and optional error message
 */
export function validateFeedbackData(data: {
  type?: string;
  message?: string;
  screenshot?: string;
}): { isValid: boolean; error?: string } {
  if (!data.type) {
    return { isValid: false, error: 'Feedback type is required' };
  }

  if (!data.message?.trim() && !data.screenshot) {
    return {
      isValid: false,
      error: 'Either a message or screenshot is required',
    };
  }

  return { isValid: true };
}

/**
 * Generate a unique ID
 *
 * @returns Unique identifier string
 *
 * @example
 * ```typescript
 * generateId(); // "1705347123456-a1b2c3d4e"
 * ```
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format file size in human-readable format
 *
 * @param bytes - File size in bytes
 * @returns Formatted size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
