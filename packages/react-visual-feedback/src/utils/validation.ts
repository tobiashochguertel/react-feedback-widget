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

// ============================================================================
// Form Validation Schema Support (I026)
// ============================================================================

/**
 * Result of validating a single field
 */
export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * A validation rule function that validates a value and returns a result
 */
export type ValidationRule<T> = (value: T) => FieldValidationResult;

/**
 * Schema defining validation rules for each field in a form
 */
export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

/**
 * Result of validating an entire form
 */
export interface FormValidationResult<T> {
  isValid: boolean;
  errors: Partial<Record<keyof T, string>>;
}

// ============================================================================
// Validation Rule Factories
// ============================================================================

/**
 * Creates a required field validation rule
 *
 * @param message - Custom error message
 * @returns Validation rule function
 *
 * @example
 * ```typescript
 * const schema = {
 *   name: [required('Name is required')],
 * };
 * ```
 */
export function required<T>(message = 'This field is required'): ValidationRule<T> {
  return (value: T): FieldValidationResult => {
    const isEmpty =
      value === null ||
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0);

    return isEmpty ? { isValid: false, error: message } : { isValid: true };
  };
}

/**
 * Creates an email validation rule
 *
 * @param message - Custom error message
 * @returns Validation rule function
 *
 * @example
 * ```typescript
 * const schema = {
 *   email: [required(), email('Please enter a valid email')],
 * };
 * ```
 */
export function email(message = 'Please enter a valid email address'): ValidationRule<string> {
  return (value: string): FieldValidationResult => {
    if (!value) return { isValid: true }; // Let required() handle empty values
    return isValidEmail(value) ? { isValid: true } : { isValid: false, error: message };
  };
}

/**
 * Creates a URL validation rule
 *
 * @param message - Custom error message
 * @returns Validation rule function
 *
 * @example
 * ```typescript
 * const schema = {
 *   website: [url('Please enter a valid URL')],
 * };
 * ```
 */
export function url(message = 'Please enter a valid URL'): ValidationRule<string> {
  return (value: string): FieldValidationResult => {
    if (!value) return { isValid: true }; // Let required() handle empty values
    return isValidUrl(value) ? { isValid: true } : { isValid: false, error: message };
  };
}

/**
 * Creates a minimum length validation rule
 *
 * @param length - Minimum length required
 * @param message - Custom error message (supports {length} placeholder)
 * @returns Validation rule function
 *
 * @example
 * ```typescript
 * const schema = {
 *   password: [minLength(8, 'Password must be at least {length} characters')],
 * };
 * ```
 */
export function minLength(
  length: number,
  message = `Must be at least ${length} characters`
): ValidationRule<string> {
  return (value: string): FieldValidationResult => {
    if (!value) return { isValid: true }; // Let required() handle empty values
    const errorMessage = message.replace('{length}', String(length));
    return value.length >= length
      ? { isValid: true }
      : { isValid: false, error: errorMessage };
  };
}

/**
 * Creates a maximum length validation rule
 *
 * @param length - Maximum length allowed
 * @param message - Custom error message (supports {length} placeholder)
 * @returns Validation rule function
 *
 * @example
 * ```typescript
 * const schema = {
 *   bio: [maxLength(500, 'Bio must be {length} characters or less')],
 * };
 * ```
 */
export function maxLength(
  length: number,
  message = `Must be ${length} characters or less`
): ValidationRule<string> {
  return (value: string): FieldValidationResult => {
    if (!value) return { isValid: true }; // Let required() handle empty values
    const errorMessage = message.replace('{length}', String(length));
    return value.length <= length
      ? { isValid: true }
      : { isValid: false, error: errorMessage };
  };
}

/**
 * Creates a regex pattern validation rule
 *
 * @param regex - Regular expression to match
 * @param message - Custom error message
 * @returns Validation rule function
 *
 * @example
 * ```typescript
 * const schema = {
 *   username: [pattern(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')],
 * };
 * ```
 */
export function pattern(
  regex: RegExp,
  message = 'Invalid format'
): ValidationRule<string> {
  return (value: string): FieldValidationResult => {
    if (!value) return { isValid: true }; // Let required() handle empty values
    return regex.test(value) ? { isValid: true } : { isValid: false, error: message };
  };
}

/**
 * Creates a minimum value validation rule for numbers
 *
 * @param minValue - Minimum value allowed
 * @param message - Custom error message (supports {min} placeholder)
 * @returns Validation rule function
 *
 * @example
 * ```typescript
 * const schema = {
 *   age: [min(18, 'Must be at least {min} years old')],
 * };
 * ```
 */
export function min(
  minValue: number,
  message = `Must be at least ${minValue}`
): ValidationRule<number> {
  return (value: number): FieldValidationResult => {
    if (value === null || value === undefined) return { isValid: true };
    const errorMessage = message.replace('{min}', String(minValue));
    return value >= minValue
      ? { isValid: true }
      : { isValid: false, error: errorMessage };
  };
}

/**
 * Creates a maximum value validation rule for numbers
 *
 * @param maxValue - Maximum value allowed
 * @param message - Custom error message (supports {max} placeholder)
 * @returns Validation rule function
 *
 * @example
 * ```typescript
 * const schema = {
 *   quantity: [max(100, 'Cannot exceed {max} items')],
 * };
 * ```
 */
export function max(
  maxValue: number,
  message = `Must be at most ${maxValue}`
): ValidationRule<number> {
  return (value: number): FieldValidationResult => {
    if (value === null || value === undefined) return { isValid: true };
    const errorMessage = message.replace('{max}', String(maxValue));
    return value <= maxValue
      ? { isValid: true }
      : { isValid: false, error: errorMessage };
  };
}

/**
 * Creates a custom validation rule
 *
 * @param validator - Custom validation function returning boolean
 * @param message - Error message when validation fails
 * @returns Validation rule function
 *
 * @example
 * ```typescript
 * const schema = {
 *   confirmPassword: [
 *     custom(
 *       (value, formData) => value === formData.password,
 *       'Passwords do not match'
 *     ),
 *   ],
 * };
 * ```
 */
export function custom<T>(
  validator: (value: T) => boolean,
  message: string
): ValidationRule<T> {
  return (value: T): FieldValidationResult => {
    return validator(value) ? { isValid: true } : { isValid: false, error: message };
  };
}

/**
 * Combines multiple validation rules into a single rule
 * Rules are executed in order, stopping at first failure
 *
 * @param rules - Array of validation rules to combine
 * @returns Combined validation rule function
 *
 * @example
 * ```typescript
 * const passwordRule = all(
 *   required('Password is required'),
 *   minLength(8, 'Password must be at least 8 characters'),
 *   pattern(/[A-Z]/, 'Password must contain an uppercase letter'),
 *   pattern(/[0-9]/, 'Password must contain a number')
 * );
 * ```
 */
export function all<T>(...rules: ValidationRule<T>[]): ValidationRule<T> {
  return (value: T): FieldValidationResult => {
    for (const rule of rules) {
      const result = rule(value);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  };
}

// ============================================================================
// Form Validation Functions
// ============================================================================

/**
 * Validates a single field against an array of validation rules
 *
 * @param value - The value to validate
 * @param rules - Array of validation rules to apply
 * @returns Validation result with isValid flag and optional error
 *
 * @example
 * ```typescript
 * const result = validateField('test@example.com', [required(), email()]);
 * if (!result.isValid) {
 *   console.log(result.error);
 * }
 * ```
 */
export function validateField<T>(
  value: T,
  rules: ValidationRule<T>[]
): FieldValidationResult {
  for (const rule of rules) {
    const result = rule(value);
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true };
}

/**
 * Validates an entire form against a validation schema
 *
 * @param data - The form data to validate
 * @param schema - Validation schema defining rules for each field
 * @returns Form validation result with isValid flag and errors object
 *
 * @example
 * ```typescript
 * interface LoginForm {
 *   email: string;
 *   password: string;
 * }
 *
 * const schema: ValidationSchema<LoginForm> = {
 *   email: [required('Email is required'), email()],
 *   password: [required('Password is required'), minLength(8)],
 * };
 *
 * const result = validateForm({ email: '', password: '123' }, schema);
 * // result.isValid === false
 * // result.errors.email === 'Email is required'
 * // result.errors.password === 'Must be at least 8 characters'
 * ```
 */
export function validateForm<T extends Record<string, unknown>>(
  data: T,
  schema: ValidationSchema<T>
): FormValidationResult<T> {
  const errors: Partial<Record<keyof T, string>> = {};
  let isValid = true;

  for (const field in schema) {
    const rules = schema[field];
    if (rules && rules.length > 0) {
      const value = data[field];
      const result = validateField(value, rules as ValidationRule<typeof value>[]);
      if (!result.isValid && result.error) {
        errors[field] = result.error;
        isValid = false;
      }
    }
  }

  return { isValid, errors };
}
